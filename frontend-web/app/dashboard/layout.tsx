'use client';

import React from 'react';
import { TelemetryProvider } from '@/lib/telemetry/TelemetryContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TelemetryProvider>{children}</TelemetryProvider>;
}
