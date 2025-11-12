"use client";

import { useEffect, useState } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await fetch("/api/client/leads", { cache: "no-store" });
        const data = await res.json();
        if (data.success) setLeads(data.leads);
      } catch (err) {
        console.error("[LeadsPage] Error fetching leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  if (loading) return <p>Loading leads...</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Leads</h1>
      {leads.length === 0 ? (
        <p>No leads yet.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th>Name</th>
              <th>Phone</th>
              <th>Source</th>
              <th>Message</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead: any) => (
              <tr key={lead.id} className="border-b border-gray-800">
                <td>{lead.name}</td>
                <td>{lead.phone}</td>
                <td>{lead.source}</td>
                <td>{lead.description || lead.message || '-'}</td>
                <td>{lead.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

