"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const time = now.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="rounded-xl bg-primary/10 p-3 text-center space-y-0.5">
      <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">{days[now.getDay()]}</p>
      <p className="text-xl font-bold tabular-nums text-foreground">{time}</p>
      <p className="text-[11px] text-muted-foreground">{date}</p>
    </div>
  );
}
