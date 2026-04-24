"use client";

import { useState } from "react";

export default function NewListingPage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: API call
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Oferta enviada!</h2>
        <p className="text-gray-600 mb-6">Tu oferta está pendiente de moderación. Te notificaremos cuando sea aprobada.</p>
        <a href="/dashboard/listings" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          Ver mis ofertas
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Publicar nueva oferta</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              s <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-blue-600" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-6">
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de la oferta *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Circuito Roma, Florencia y Venecia 7 días"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white"
              >
                <option value="">Selecciona...</option>
                <option value="vuelos-hotel">Vuelos + Hotel</option>
                <option value="solo-hotel">Solo Hotel</option>
                <option value="cruceros">Cruceros</option>
                <option value="circuitos">Circuitos y Tours</option>
                <option value="aventura">Aventura / Naturaleza</option>
                <option value="novios">Novios / Luna de miel</option>
                <option value="mice">MICE</option>
                <option value="estudios">Estudios / Idiomas</option>
                <option value="escapadas">Escapadas</option>
                <option value="accesibles">Accesibles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe el itinerario, qué incluye, puntos fuertes..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Siguiente →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio por persona (€) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (días)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej: Italia"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                ← Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Siguiente →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">Resumen de la oferta</h3>
              <p><span className="text-gray-500">Título:</span> {title}</p>
              <p><span className="text-gray-500">Categoría:</span> {category}</p>
              <p><span className="text-gray-500">Precio:</span> {price}€</p>
              <p><span className="text-gray-500">Destino:</span> {destination}</p>
              <p><span className="text-gray-500">Duración:</span> {duration} días</p>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                ← Atrás
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Enviando..." : "✅ Publicar oferta"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
