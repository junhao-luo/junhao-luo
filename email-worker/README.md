# Contact email through Resend

This Worker serves `POST /api/contact` for the existing GitHub Pages website. It sends inquiries and footer contact requests to **eljhonstevesatsat@gmail.com**. The visitor's email is the reply-to address. It does not send automatic replies or create mailing-list subscriptions.

## Activate

1. Verify `eljhon.me` in Resend. The domain has been registered in the supplied Resend account, but DNS verification is pending. Follow the Namecheap steps below. The domain currently has Namecheap forwarding MX records; leave **Mail Settings** unchanged until the owner confirms whether forwarding is used. Namecheap documents that free forwarding cannot coexist with another email service, and Resend's Namecheap guide requires **Custom MX**. Do not replace forwarding without that decision or change the domain's nameservers.
2. Authenticate Cloudflare and deploy the Worker:

   ```powershell
   rtk proxy npm.cmd exec --yes --package=wrangler -- wrangler login
   rtk proxy npm.cmd exec --yes --package=wrangler -- wrangler secret put RESEND_API_KEY --config email-worker/wrangler.jsonc
   rtk proxy npm.cmd exec --yes --package=wrangler -- wrangler deploy --config email-worker/wrangler.jsonc
   ```

   Paste the API key only into Wrangler's secret prompt. Never add it to HTML, JavaScript, the Wrangler configuration, or Git. The supplied key was saved locally outside this repository under `C:/Users/eljho/.codex/secrets/junhao-luo-resend.env`.
3. The Worker is deployed at `https://eljhon-contact.junhao-luo.workers.dev/api/contact`, and this is already set in the `contact-endpoint` meta tag in `index.html`. The key is stored as a Cloudflare Worker secret.
4. Publish the updated static website through its existing GitHub Pages workflow. The website's hosting and domain remain unchanged.
5. Submit one real inquiry and confirm delivery to the inbox. Local automated tests intercept the provider and do not send real email.

## Resend DNS records

Use Namecheap's host values below. TTL can be automatic. The records belong to email sending and do not replace existing website or inbox records.

| Type | Host | Value | Priority |
| --- | --- | --- | --- |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQClYUc5ra0PLrId30Fsg6d1TMEdnydZ8rg+Ti1F+wsD/sWj3citRPt+hR3xOuh1OtDpeDkB4M7zEc8JIf7kBlJ5JoKtr33O2V9CKtUBFM0x/PLuUQO7LBj0W7CHgpD9KGzsPT8ufvg5rKYOAbFkBrneWbmOHSyQ1fLotxy9oIJMbwIDAQAB` | — |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| CNAME | `rsend` | `send.forge.rmta.net` | — |

These records are also available in Resend's domain page. They are public DNS data, not the API key.

### Add the Host Records now

1. Sign in to Namecheap, select **Domain List**, and click **Manage** beside `eljhon.me`.
2. Open **Advanced DNS** and find **Host Records**.
3. Click **Add New Record** three times. Add the two TXT rows and the CNAME row from the table above. Use only the host shown, without appending `.eljhon.me`. Copy the complete DKIM value, including `p=`, without extra quotes.
4. Set **TTL** to **Automatic** and save each row with the checkmark. Leave existing website records, forwarding SPF, and **Mail Settings** intact. If a matching host/type already exists, check its value instead of adding a duplicate.

### Finish the MX record after the forwarding decision

If the owner confirms that Namecheap forwarding is unused and can be disabled, select **Mail Settings → Custom MX**, add the MX row with host `send`, value `feedback-smtp.ap-northeast-1.amazonses.com`, priority **10**, and automatic TTL, then save. This setting replaces the forwarding preset; copying its old MX entries does not make forwarding supported under Custom MX.

If forwarding must remain, stop before changing Mail Settings. Arrange a sending domain or DNS/mail setup compatible with Resend first. This requires a separate owner decision.

Once all required records are saved, open **Resend → Domains → eljhon.me** and select **Verify DNS Records**. Wait for the domain to show **Verified** before testing delivery.

## Configuration and tests

The Worker only permits `https://eljhon.me` and `https://www.eljhon.me`. For local Wrangler development, add the localhost origin to `ALLOWED_ORIGINS` through a local, ignored `.dev.vars` file. Store `RESEND_API_KEY` there only for local testing; don't serve this file through the website preview server.

```powershell
rtk proxy node --test tests/contact-api.test.mjs
rtk proxy npm.cmd exec --yes --package=wrangler -- wrangler deploy --dry-run --config email-worker/wrangler.jsonc
rtk proxy playwright-cli -s=contact open http://127.0.0.1:4173/
rtk proxy playwright-cli -s=contact run-code --filename=tests/contact-form-check.js
```

The endpoint validates and bounds input, sends plain text to a fixed recipient, checks allowed origins, rejects honeypot submissions, caps request frequency, and uses Resend idempotency keys on retries. Cloudflare rate limiting applies per location; it is an abuse control rather than a global billing cap. Failures retain entered details and show an error. Resend API acceptance indicates the email was queued, not guaranteed inbox delivery.

References: [Resend sending API](https://resend.com/docs/api-reference/emails/send-email), [verified domains](https://resend.com/docs/dashboard/domains/introduction), [Resend Namecheap setup](https://resend.com/docs/guides/dns/namecheap), [Namecheap forwarding limitations](https://www.namecheap.com/support/knowledgebase/article.aspx/308/2214/how-to-set-up-free-email-forwarding/), [Cloudflare rate-limit bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
