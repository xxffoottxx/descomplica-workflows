const express = require('express');
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3010;
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

// Accept large payloads (PDFs can be several MB as base64)
app.use(express.json({ limit: '50mb' }));

// Serve Faturas.html (branding tool) as static
app.use('/static', express.static(path.join(__dirname, 'public')));

// ── Shared browser instance ──
let browser = null;

async function getBrowser() {
    if (browser && browser.connected) return browser;
    console.log('[browser] Launching Chromium...');
    browser = await puppeteer.launch({
        executablePath: CHROMIUM_PATH,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--single-process'
        ]
    });
    browser.on('disconnected', () => {
        console.log('[browser] Disconnected. Will relaunch on next request.');
        browser = null;
    });
    console.log('[browser] Ready.');
    return browser;
}

// ── Health check ──
app.get('/health', async (req, res) => {
    try {
        const b = await getBrowser();
        res.json({ status: 'ok', browserConnected: b.connected });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ── Brand invoice endpoint ──
app.post('/brand-invoice', async (req, res) => {
    const { pdfBase64, fileName } = req.body;
    const requestId = crypto.randomUUID().slice(0, 8);
    const start = Date.now();

    console.log(`[${requestId}] Processing: ${fileName || 'unknown.pdf'}`);

    if (!pdfBase64) {
        return res.status(400).json({ success: false, error: 'Missing pdfBase64' });
    }

    let page = null;
    let tempFile = null;
    const downloadDir = path.join(os.tmpdir(), `brand-dl-${requestId}`);

    try {
        // Write PDF to temp file for Puppeteer upload
        tempFile = path.join(os.tmpdir(), `invoice-${requestId}.pdf`);
        fs.writeFileSync(tempFile, Buffer.from(pdfBase64, 'base64'));

        const b = await getBrowser();
        page = await b.newPage();

        // Set consistent viewport for rendering
        await page.setViewport({ width: 1200, height: 900 });

        // Forward page errors to server logs
        page.on('pageerror', err => {
            console.error(`[${requestId}:page:error] ${err.message}`);
        });

        // Navigate to the branding tool
        const toolUrl = `http://localhost:${PORT}/static/faturas.html`;
        await page.goto(toolUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        // Upload the PDF via the file input
        const fileInput = await page.$('#file-input');
        if (!fileInput) throw new Error('File input not found on page');
        await fileInput.uploadFile(tempFile);

        // Wait for processing to complete (button becomes visible)
        await page.waitForSelector('.btn-generate.visible', { timeout: 30000 });

        // Verify processing succeeded
        const status = await page.$eval('#status-msg', el => ({
            text: el.textContent,
            classes: el.className
        }));

        if (status.classes.includes('error')) {
            throw new Error('PDF processing failed: ' + status.text);
        }

        console.log(`[${requestId}] Parsed OK: ${status.text}`);

        // Set up download interception to capture the PDF that jsPDF.save() generates
        fs.mkdirSync(downloadDir, { recursive: true });
        const cdp = await page.createCDPSession();
        await cdp.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir
        });

        // Watch for generation completion/errors
        await page.evaluate(() => {
            window.__brandGenDone = false;
            window.__brandGenError = null;

            const observer = new MutationObserver(() => {
                const statusEl = document.getElementById('status-msg');
                if (statusEl && statusEl.classList.contains('error')) {
                    window.__brandGenError = statusEl.textContent;
                    window.__brandGenDone = true;
                }
            });
            const statusEl = document.getElementById('status-msg');
            if (statusEl) observer.observe(statusEl, { attributes: true, childList: true, characterData: true });

            // Watch for button re-enable (generation finished)
            const btn = document.getElementById('btn-generate');
            new MutationObserver(() => {
                if (!btn.disabled) window.__brandGenDone = true;
            }).observe(btn, { attributes: true });
        });

        // Click generate
        await page.click('#btn-generate');

        // Wait for generation to complete
        await page.waitForFunction(
            () => window.__brandGenDone === true,
            { timeout: 180000, polling: 500 }
        );

        // Check for errors
        const genError = await page.evaluate(() => window.__brandGenError);
        if (genError) throw new Error('PDF generation failed: ' + genError);

        // Wait for download to finish writing
        await new Promise(r => setTimeout(r, 2000));

        // Find the downloaded file
        const downloadedFiles = fs.readdirSync(downloadDir);
        const pdfFile = downloadedFiles.find(f => f.endsWith('.pdf'));

        if (!pdfFile) {
            throw new Error('No PDF downloaded. Files in dir: ' + downloadedFiles.join(', '));
        }

        const pdfBuffer = fs.readFileSync(path.join(downloadDir, pdfFile));
        const outputBase64 = pdfBuffer.toString('base64');

        const elapsed = Date.now() - start;
        console.log(`[${requestId}] Done in ${elapsed}ms. Output: ${pdfFile} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);

        res.json({
            success: true,
            brandedPdfBase64: outputBase64,
            fileName: pdfFile
        });

    } catch (err) {
        const elapsed = Date.now() - start;
        console.error(`[${requestId}] Error after ${elapsed}ms:`, err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        // Clean up
        if (page) {
            try { await page.close(); } catch (_) {}
        }
        if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile); } catch (_) {}
        }
        try { fs.rmSync(downloadDir, { recursive: true, force: true }); } catch (_) {}
    }
});

// ── Graceful shutdown ──
async function shutdown() {
    console.log('[server] Shutting down...');
    if (browser) {
        try { await browser.close(); } catch (_) {}
    }
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ── Start ──
app.listen(PORT, () => {
    console.log(`[server] Invoice branding service running on port ${PORT}`);
    console.log(`[server] POST /brand-invoice — accepts { pdfBase64, fileName }`);
    console.log(`[server] GET  /health — health check`);
});
