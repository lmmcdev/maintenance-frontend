import { Ticket, Person } from "../types/ticket";

export async function patchTicket(
  apiBase: string,
  id: string,
  body: Partial<{
    assignee: string;
    assigneeId: string;
    priority: Ticket["priority"];
    category: string;
    subcategory: { name: string; displayName: string };
  }>
) {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    let errorMessage = `Update failed: HTTP ${res.status}`;
    let errorDetails = null;
    
    try {
      const errorData = await res.json();
      errorDetails = errorData;
      
      console.error('Backend error response:', errorData);
      console.error('Full error response structure:', JSON.stringify(errorData, null, 2));
      
      // Handle different error formats from backend
      if (typeof errorData === 'string') {
        errorMessage = `${errorMessage} - ${errorData}`;
      } else if (errorData.message) {
        errorMessage = `${errorMessage} - ${errorData.message}`;
      } else if (errorData.error && typeof errorData.error === 'string') {
        errorMessage = `${errorMessage} - ${errorData.error}`;
      } else if (errorData.error && typeof errorData.error === 'object') {
        errorMessage = `${errorMessage} - ${JSON.stringify(errorData.error)}`;
      } else if (errorData.details) {
        errorMessage = `${errorMessage} - ${errorData.details}`;
      } else {
        // If it's an object but no standard message field, stringify it
        errorMessage = `${errorMessage} - ${JSON.stringify(errorData)}`;
      }
    } catch (parseError) {
      console.error('Could not parse error response:', parseError);
      errorMessage = `${errorMessage} - Unable to parse error response`;
    }
    
    // Add more specific error messages based on status codes
    switch (res.status) {
      case 400:
        if (!errorMessage.includes('category') && !errorMessage.includes('priority')) {
          errorMessage += " (Bad Request: Check request format and required fields)";
        }
        break;
      case 404:
        errorMessage += " (Ticket not found)";
        break;
      case 422:
        errorMessage += " (Validation failed)";
        break;
    }
    
    console.error('Patch ticket error:', {
      ticketId: id,
      body,
      status: res.status,
      url: `${apiBase}/api/v1/tickets/${id}`,
      errorDetails
    });
    
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function patchStatus(apiBase: string, id: string, status: "OPEN" | "DONE") {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Status change failed: HTTP ${res.status}`);
  return res.json();
}

export async function cancelTicket(apiBase: string, id: string) {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    // fallback: si tu backend no tiene cancel, lo marcamos DONE como placeholder
    await patchStatus(apiBase, id, "DONE");
  }
  return true;
}

export async function searchPersons(apiBase: string, q: string): Promise<Person[]> {
  const url = `${apiBase}/api/v1/persons?q=${encodeURIComponent(q)}&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`People search failed: HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.items ?? [];
}