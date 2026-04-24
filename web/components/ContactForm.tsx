"use client";

import { useState } from "react";

interface ContactFormProps {
  listingId: number;
}

export function ContactForm({ listingId }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: send to API
    console.log({ listingId, name, email, phone, message });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center">
        <p className="font-semibold">✓ Mensaje enviado</p>
        <p className="text-sm mt-1">La agencia te contactará pronto.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-gray-900">Contactar agencia</h3>

      <input
        type="text"
        placeholder="Tu nombre"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />
      <input
        type="email"
        placeholder="Tu email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />
      <input
        type="tel"
        placeholder="Teléfono (opcional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />
      <textarea
        placeholder="¿Qué fechas te interesan? ¿Cuántos viajeros?"
        rows={3}
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
      >
        Enviar mensaje
      </button>

      <p className="text-xs text-gray-400 text-center">
        Al enviar, aceptas nuestra política de privacidad.
      </p>
    </form>
  );
}
