import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="bn">
      <Head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <title>দিনলিপি — প্রতিদিনের ছোট ছোট তথ্য, এক জায়গায়</title>
        <meta name="theme-color" content="#0A0F14" />
        <meta name="description" content="দিনলিপি — অফলাইন স্বাস্থ্য, পড়াশোনা ও দৈনন্দিন জীবনের ইভেন্ট-ভিত্তিক ট্র্যাকার। বাংলা ইন্টারফেস, JSON ব্যাকআপ।" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="দিনলিপি" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}