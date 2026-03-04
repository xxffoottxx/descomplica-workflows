# Social Media Scheduler for Descomplicador.pt

Automated content scheduling and cross-posting system for Instagram, LinkedIn, Facebook, YouTube, and Google Business Profile.

---

## What This System Does

- **Schedule posts** in advance via Google Sheets
- **Adapt content** automatically per platform using Gemini Flash 2.5 (pt-PT)
- **Cross-post** to multiple platforms with one click
- **Update status** in sheet after publishing
- **Send notifications** with publishing summary

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `workflow-design.md` | Complete workflow architecture, node specifications, platform integration details |
| `content-calendar-template.md` | Google Sheets structure, validation rules, example posts |
| `setup-guide.md` | Step-by-step implementation guide (API credentials, n8n config, testing) |
| `README.md` | This file |

---

## Platform Support

| Platform | Automation Status | Notes |
|----------|------------------|-------|
| Instagram | ✅ Full | Images and carousels (no Reels) |
| Facebook | ✅ Full | Photos with captions |
| LinkedIn | ⚠️ Text-only | Image posting requires complex Assets API |
| YouTube | ❌ Manual | Community Tab API not public |
| Google Business | ❌ Manual | API deprecated |

---

## Implementation Status

**Designed:** ✅ Complete
**Documented:** ✅ Complete
**Built in n8n:** ❌ Not yet
**Tested:** ❌ Not yet
**Deployed:** ❌ Not yet

---

## Next Steps

1. **Read `setup-guide.md`** — Complete Phase 1 (API credentials setup)
2. **Create Google Sheets** — Follow `content-calendar-template.md`
3. **Build workflows in n8n** — Follow `workflow-design.md` node specifications
4. **Test with sample post** — Verify full pipeline works
5. **Plan first month of content** — Fill calendar with 20-30 posts
6. **Go live** — Activate workflows, monitor daily

---

## Time Estimates

- **Setup:** 3-4 hours (first time)
- **Weekly maintenance:** 30 minutes (content planning + monitoring)
- **Monthly time saved:** 37+ hours (vs manual posting)

---

## Support

- **Technical issues:** Check `setup-guide.md` Troubleshooting section
- **Workflow questions:** Refer to `workflow-design.md`
- **Contact:** andrefloresbrasil@gmail.com

---

## Cost Analysis

**Monthly API Costs:** $0 (all free tiers)

- Gemini Flash 2.5: Free (under 60 RPM)
- Instagram/Facebook/LinkedIn APIs: Free
- Google Sheets API: Free
- Image hosting (R2): ~$1-5/month (optional)

---

## Architecture Summary

### Workflow 1: Content Scheduler
- **Trigger:** Daily at 09:00 (Azores time)
- **Source:** Google Sheets (reads today's scheduled posts)
- **Process:** For each post → adapt content per platform (Gemini) → post to selected platforms → update sheet status → send email notification

### Workflow 2: AI Content Adapter
- **Trigger:** Webhook (called by Workflow 1)
- **Input:** Main text + content pillar
- **Process:** Generate 5 platform-specific versions (Instagram, LinkedIn, Facebook, YouTube, Google Business)
- **Output:** JSON with all adapted versions

---

## Key Features

- ✅ **AI-powered adaptation** — Each platform gets optimized copy (hashtags, tone, length)
- ✅ **European Portuguese (pt-PT)** — All content in correct regional language
- ✅ **Error handling** — Failed platforms don't block others, status tracked in sheet
- ✅ **Manual fallback** — YouTube/Google Business content generated but requires manual posting
- ✅ **Email summaries** — Daily reports of what published successfully
- ✅ **Content pillars** — Balance education, sales, behind-the-scenes, results
- ✅ **Zero monthly cost** — All APIs within free tiers

---

## Production Checklist

Before going live:

- [ ] All platform API credentials created and tested
- [ ] Google Sheets calendar set up with validation rules
- [ ] Service Account shared on sheet (Editor permission)
- [ ] Both workflows built and activated in n8n
- [ ] Test execution successful (manual trigger)
- [ ] Image hosting solution operational
- [ ] First month of content planned
- [ ] Email notifications working
- [ ] Monitoring checklist created

---

**Last Updated:** 2026-03-04
**Version:** 1.0
**Status:** Design complete, implementation pending
