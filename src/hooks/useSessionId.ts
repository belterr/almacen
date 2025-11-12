"use client";

import { useState } from "react";

export function useSessionId() {
  const [sessionId] = useState<string>(() => {
    // Esta función solo se ejecuta una vez al montar el componente
    if (typeof window === "undefined") {
      return "";
    }

    // Intentar obtener sessionId de localStorage
    let id = localStorage.getItem("cartSessionId");
    
    if (!id) {
      // Generar un nuevo sessionId
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("cartSessionId", id);
    }
    
    return id;
  });

  return sessionId;
}
