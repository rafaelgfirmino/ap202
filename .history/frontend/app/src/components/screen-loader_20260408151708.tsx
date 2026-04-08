'use client';

import { toAbsoluteUrl } from '@/lib/helpers';

export function ScreenLoader() {
  return (
    <div id="screen-loader" className="flex flex-col items-center gap-2 justify-center fixed inset-0 z-50 transition-opacity duration-700 ease-in-out">
      <img
        id="screen-loader-logo"
        className="h-[30px] w-auto max-w-none"
        src={toAbsoluteUrl('/media/app/logo2.png')}
        alt="logo"
      />
      <div id="screen-loader-text" className="text-muted-foreground font-medium text-sm">
        Loading...
      </div>
    </div>
  );
}
