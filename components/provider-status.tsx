"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ProviderStatus {
  provider: string;
  model: string;
  baseURL: string;
  connected: boolean;
  error?: string;
}

export function ProviderStatus() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/provider-status");
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch provider status:", error);
        setStatus({
          provider: "unknown",
          model: "unknown",
          baseURL: "unknown",
          connected: false,
          error: "Failed to fetch status",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-3 bg-gray-100 rounded-lg border">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Checking provider...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "openai":
        return "●";
      case "ollama":
        return "●";
      case "claude":
        return "●";
      case "gemini":
        return "●";
      case "custom":
        return "●";
      default:
        return "●";
    }
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? "text-gray-800" : "text-gray-500";
  };

  const getStatusDot = (connected: boolean) => {
    return connected ? "bg-gray-800" : "bg-gray-400";
  };

  return (
    <div className="p-3 bg-gray-100 rounded-lg border">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${getStatusDot(
                status.connected
              )}`}
            ></div>
            <span className="text-sm font-medium text-gray-900">
              {status.provider.charAt(0).toUpperCase() +
                status.provider.slice(1)}
            </span>
          </div>
          <span
            className={`text-xs font-medium ${getStatusColor(
              status.connected
            )}`}
          >
            {status.connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          <div>Model: {status.model}</div>
          {status.baseURL && status.baseURL !== "unknown" && (
            <div className="truncate mt-1">URL: {status.baseURL}</div>
          )}
        </div>
        {status.error && (
          <div className="text-xs text-gray-800 bg-gray-200 p-2 rounded border-l-2 border-gray-400">
            {status.error}
          </div>
        )}
      </div>
    </div>
  );
}
