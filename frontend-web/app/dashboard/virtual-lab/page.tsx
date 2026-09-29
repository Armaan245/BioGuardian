'use client';

import { DigitalTwinView } from '@/components/twin/DigitalTwinView';

export default function DashboardVirtualLabPage() {
  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden bg-[#060a12] text-white flex flex-col">
      <main className="flex-1 w-full h-full min-h-0 relative overflow-hidden flex flex-col p-0 m-0">
        <DigitalTwinView fullscreen initialEnvironmentMode="VIRTUAL_LAB" />
      </main>
    </div>
  );
}
