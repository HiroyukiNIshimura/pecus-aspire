"use client";

import { fetchWeather } from "@/app/actions/weather";

const handleFetchWeather = async () => {
  try {
    const data = await fetchWeather();
    console.log(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
};

export default function FetchBtn() {
  return (
    <button
      type="button"
      onClick={handleFetchWeather}
      className="inline-block cursor-pointer rounded-md bg-blue-500 px-4 py-3
            text-center text-sm font-semibold uppercase text-white transition
            duration-200 ease-in-out hover:bg-blue-600"
    >
      Fetch Data
    </button>
  );
}
