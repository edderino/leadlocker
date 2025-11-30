"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default function ForwardingStatus({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<"none" | "pending" | "working">("none");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/client/forwarding-status?client_id=${clientId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setStatus(data.status);
    }
    load();
    
    // Poll every 10 seconds to check for updates
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [clientId]);

  const render = () => {
    switch (status) {
      case "working":
        return (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-900/20 border border-green-800">
            <CheckCircle className="text-green-400" size={20} />
            <p className="text-green-300 font-medium">Forwarding is working!</p>
          </div>
        );

      case "pending":
        return (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-900/20 border border-yellow-800">
            <Clock className="text-yellow-400" size={20} />
            <p className="text-yellow-300 font-medium">
              Forwarding not detected yet — send a test email or finish your setup.
            </p>
          </div>
        );

      default:
      case "none":
        return (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-900/20 border border-red-800">
            <AlertTriangle className="text-red-400" size={20} />
            <p className="text-red-300 font-medium">
              No forwarding set up yet — complete the steps below.
            </p>
          </div>
        );
    }
  };

  return <div className="mb-6">{render()}</div>;
}

