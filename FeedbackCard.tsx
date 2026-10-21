'use client';

import { useState } from 'react';

interface FeedbackProps {
  bookingId?: string;
  restaurant?: string;
}

export default function FeedbackCard({ bookingId, restaurant }: FeedbackProps) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitted(true);
  };

  return (
    <div className="p-4 my-3 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-xs tracking-wide text-slate-200 uppercase">
          Rate Your Experience
        </h3>
        {restaurant && (
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
            {restaurant}
          </span>
        )}
      </div>

      {submitted ? (
        <div className="py-3 text-center space-y-1">
          <div className="text-xl">🎉</div>
          <p className="text-xs font-medium text-emerald-400">Thank you for your feedback!</p>
          <p className="text-[11px] text-slate-400">Your rating helps us personalize future suggestions.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-slate-300">
            How satisfied were you with this recommendation?
          </p>

          <div className="flex items-center gap-1 justify-center py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-2xl transition-transform hover:scale-110 ${
                  star <= (hover || rating) ? 'text-amber-400' : 'text-slate-600'
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                ★
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="space-y-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional feedback (e.g. Loved the Paneer Tikka!)"
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
              >
                Submit Rating
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}