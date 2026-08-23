import type { Metadata } from "next";

export const SITE_NAME = "The Lonesome Era";
export const SITE_ORIGIN = "https://thelonesomeera.com";
export const DEFAULT_DESCRIPTION =
  "程式、遊戲、產品與生活觀察，一個偏離喧囂、保留好奇心的數位角落。";

type SocialImage = {
  path: string;
  width: number;
  height: number;
  alt: string;
};

const defaultSocialImage: SocialImage = {
  path: "/images/creative-studio.png",
  width: 1122,
  height: 1402,
  alt: "夜晚城市窗景前的創作工作桌",
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: string;
  image?: SocialImage;
};

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle,
  image = defaultSocialImage,
}: PageMetadataOptions): Metadata {
  const socialTitle = absoluteTitle ?? `${title}｜${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: {
      canonical: path,
      types: {
        "application/rss+xml": "/rss.xml",
      },
    },
    openGraph: {
      title: socialTitle,
      description,
      type: "website",
      locale: "zh_TW",
      url: path,
      siteName: SITE_NAME,
      images: [
        {
          url: image.path,
          width: image.width,
          height: image.height,
          alt: image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.path],
    },
  };
}
