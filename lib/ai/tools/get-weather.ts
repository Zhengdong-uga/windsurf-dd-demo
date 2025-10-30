import { tool } from "ai";
import { z } from "zod";

async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch {
    return null;
  }
}

export const getWeather = tool({
  description: "Get the current weather at a location. Provide either a city OR both latitude and longitude.",
  inputSchema: z
    .object({
      city: z
        .string()
        .describe("City name (e.g., 'San Francisco', 'New York', 'London')")
        .optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .refine(
      (v) =>
        (typeof v.city === "string" && v.city.length > 0 && v.latitude === undefined && v.longitude === undefined) ||
        (v.city === undefined && typeof v.latitude === "number" && typeof v.longitude === "number"),
      {
        message:
          "Provide either { city } or both { latitude, longitude } (but not a mix).",
      }
    ),
  execute: async (input) => {
    let latitude: number;
    let longitude: number;

    if (input.city) {
      const coords = await geocodeCity(input.city);
      if (!coords) {
        return {
          error: `Could not find coordinates for "${input.city}". Please check the city name.`,
        };
      }
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else {
      // At this point, refinement ensures both latitude and longitude exist
      latitude = input.latitude as number;
      longitude = input.longitude as number;
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
    );

    const weatherData = await response.json();

    if (input.city) {
      (weatherData as any).cityName = input.city;
    }

    return weatherData;
  },
});
