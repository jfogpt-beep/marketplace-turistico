"use client";

import { useState } from "react";

const conversations = [
  { id: 1, clientName: "María García", listingTitle: "Circuito Italia 7 días", lastMessage: "¿Hay disponibilidad para mayo?", unread: 2, date: "Hace 2h" },
  { id: 2, clientName: "Carlos López", listingTitle: "Escapada París", lastMessage: "¿Incluye el vuelo de vuelta?", unread: 0, date: "Hace 5h" },
  { id: 3, clientName: "Ana Martínez", listingTitle: "Crucero Caribe", lastMessage: "Gracias por la información!", unread: 0, date: "Ayer" },
  { id: 4, clientName: "Pedro Ruiz", listingTitle: "Circuito Italia 7 días", lastMessage: "¿Cuál es la política de cancelación?", unread: 1, date: "Hace 3d" },
];

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<number | null>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mensajes</h1>

      <div className="bg-white border rounded-xl overflow-hidden flex h-[600px]">
        {/* Conversation list */}
        <div className="w-80 border-r overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                selectedConv === conv.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900">{conv.clientName}</span>
                {conv.unread > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {conv.unread}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-600 mb-1">{conv.listingTitle}</p>
              <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
              <p className="text-xs text-gray-400 mt-1">{conv.date}</p>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              <div className="p-4 border-b">
                <p className="font-medium text-gray-900">
                  {conversations.find((c) => c.id === selectedConv)?.clientName}
                </p>
                <p className="text-xs text-blue-600">
                  {conversations.find((c) => c.id === selectedConv)?.listingTitle}
                </p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-md">
                    <p className="text-sm">Hola, me interesa esta oferta. ¿Hay disponibilidad para mayo?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-md">
                    <p className="text-sm">¡Hola María! Sí, tenemos plazas disponibles para mayo. ¿Para cuántas personas sería?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-md">
                    <p className="text-sm">Seríamos 2 adultos. ¿El precio incluye vuelos?</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    Enviar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Selecciona una conversación para ver los mensajes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
