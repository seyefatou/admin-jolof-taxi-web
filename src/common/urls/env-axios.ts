const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

export const AxiosCallerUrls: Record<string, string> = {
  BASE_URL: isDev ? "/api/proxy/" : "https://api.joloftaxi.sn/api/",
  PLATFORM_URL: "",
};
