"use client";

import { useState } from "react";
import { Search, MapPin, Loader2, Waves, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  population?: number;
  marineWeather?: MarineWeather;
  isLoadingWeather?: boolean;
  weatherError?: boolean;
}

interface MarineWeather {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    wave_height: number;
    sea_surface_temperature: number;
  };
  current_units: {
    wave_height: string;
    sea_surface_temperature: string;
  };
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const searchLocations = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a location to search");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=10&language=en&format=json`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setLocations(data.results);
      } else {
        setLocations([]);
        setError("No locations found. Try a different search term.");
      }
    } catch (err) {
      setError("An error occurred while searching. Please try again.");
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchLocations();
    }
  };

  const fetchMarineWeather = async (location: Location) => {
    // Update the location to show loading state
    setLocations(prevLocations => 
      prevLocations.map(loc => 
        loc.id === location.id 
          ? { ...loc, isLoadingWeather: true, marineWeather: undefined }
          : loc
      )
    );
    
    try {
      const response = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${location.latitude}&longitude=${location.longitude}&current=wave_height,sea_surface_temperature`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch marine weather");
      }

      const data: MarineWeather = await response.json();
      
      // Check if we have valid data
      const hasData = data.current && 
        (data.current.wave_height !== null && data.current.wave_height !== undefined) &&
        (data.current.sea_surface_temperature !== null && data.current.sea_surface_temperature !== undefined);
      
      // Update the location with weather data
      setLocations(prevLocations => 
        prevLocations.map(loc => 
          loc.id === location.id 
            ? { 
                ...loc, 
                isLoadingWeather: false, 
                marineWeather: hasData ? data : undefined,
                weatherError: !hasData
              }
            : loc
        )
      );
    } catch (err) {
      console.error("Error fetching marine weather:", err);
      // Update to show error state
      setLocations(prevLocations => 
        prevLocations.map(loc => 
          loc.id === location.id 
            ? { ...loc, isLoadingWeather: false, weatherError: true }
            : loc
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 p-8">
      <main className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight">Location Search</h1>
          <p className="text-muted-foreground text-lg">
            Search for locations worldwide using Open-Meteo Geocoding API
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Find a Location</CardTitle>
            <CardDescription>
              Enter a city name, address, or place to search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>
              <Button onClick={searchLocations} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>

            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
          </CardContent>
        </Card>

        {locations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Found {locations.length} location{locations.length > 1 ? "s" : ""}
            </h2>
            <div className="grid gap-4">
              {locations.map((location) => (
                <Card 
                  key={location.id} 
                  className={`hover:border-primary transition-colors cursor-pointer ${
                    location.marineWeather ? "border-primary" : ""
                  }`}
                  onClick={() => !location.marineWeather && fetchMarineWeather(location)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-2">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">
                          {location.name}
                          {location.admin1 && `, ${location.admin1}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {location.country}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                          <span>
                            Lat: {location.latitude.toFixed(4)}
                          </span>
                          <span>
                            Lon: {location.longitude.toFixed(4)}
                          </span>
                          {location.population && (
                            <span>
                              Pop: {location.population.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {location.isLoadingWeather && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading marine weather...</span>
                        </div>
                      </div>
                    )}

                    {location.weatherError && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex flex-col items-center justify-center py-4 px-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                          <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                            No marine weather data available for this location. This area may not have ocean or sea coverage.
                          </p>
                        </div>
                      </div>
                    )}

                    {location.marineWeather && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground">Marine Weather</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex items-start gap-3 bg-blue-500/5 rounded-lg p-3">
                            <div className="rounded-full bg-blue-500/10 p-2">
                              <Waves className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground">Wave Height</p>
                              <p className="text-xl font-bold">
                                {location.marineWeather.current.wave_height}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                  {location.marineWeather.current_units.wave_height}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 bg-orange-500/5 rounded-lg p-3">
                            <div className="rounded-full bg-orange-500/10 p-2">
                              <Thermometer className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground">Sea Temperature</p>
                              <p className="text-xl font-bold">
                                {location.marineWeather.current.sea_surface_temperature}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                  {location.marineWeather.current_units.sea_surface_temperature}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(location.marineWeather.current.time).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
