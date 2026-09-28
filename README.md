# squint

A free QR code generator that runs in your browser. No sign-up, no watermark, and the codes never expire.

**Live:** https://vjadh07.github.io/squint/

## why i made this

Most "free" QR sites give you a code that points to their server first, then kill it when the trial ends. Squint makes static codes, so your link is stored in the pattern itself. Nothing in the middle can break or track it. Everything happens in JavaScript on your machine, nothing gets uploaded.

## what it does

- Links, plain text, Wi-Fi logins, email, phone, SMS and contact cards
- Dot styles (square, blobby, dots, bars) and corner styles (square, soft, round)
- Custom colors, transparent background, a logo in the middle, and a "scan me" sticker frame
- Warns you if your colors will be hard to scan
- Download as PNG (512 to 2048 px) or SVG, or copy straight to the clipboard

## running it locally

It's just static files, no build step.

```bash
npm start      # serves on http://localhost:5180
npm test       # runs the unit tests (node 20+)
```

## how it's built

- `js/payload.js` turns form fields into the text that goes in the code (Wi-Fi and vCard need escaping)
- `js/render.js` turns the QR matrix into an SVG with the different styles
- `js/app.js` wires up the page
- QR encoding is done by [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), vendored in `vendor/`

The alignment squares are always drawn solid, even in the dots style, because scanners need them to lock on.

QR Code is a registered trademark of DENSO WAVE.
