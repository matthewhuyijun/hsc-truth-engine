import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import enMessages from "../messages/en.json";
import zhMessages from "../messages/zh.json";
import { getTraditionalMessages } from "./convert";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  if (locale === "zh-Hant") {
    return {
      locale,
      messages: await getTraditionalMessages(),
    };
  }

  return {
    locale,
    messages: locale === "zh" ? zhMessages : enMessages,
  };
});
