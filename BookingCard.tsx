import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface BookingProps {
  status: string;
  restaurant: string;
  guests: number;
  date: string;
  time: string;
  bookingId: string;
}

export default function BookingCard({
  status,
  restaurant,
  guests,
  date,
  time,
  bookingId,
}: BookingProps) {
  const { user } = useUser();
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const sendNotification = async () => {
      const userEmail = user?.primaryEmailAddress?.emailAddress;

      try {
        await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant,
            guests,
            date,
            time,
            bookingId,
            userEmail,
          }),
        });
        setEmailSent(true);
      } catch (err) {
        console.error('Failed to trigger confirmation email:', err);
      }
    };

    sendNotification();
  }, [restaurant, guests, date, time, bookingId, user]);

  return (
    <div className="p-4 my-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-emerald-800 text-sm">{restaurant}</span>
        <span className="text-xs bg-emerald-600 text-white font-medium px-2 py-0.5 rounded-full">
          {status}
        </span>
      </div>
      <div className="text-xs text-slate-600 space-y-1">
        <p><strong>Booking ID:</strong> {bookingId}</p>
        <p><strong>Guests:</strong> {guests}</p>
        <p><strong>Date & Time:</strong> {date} at {time}</p>
      </div>
      {emailSent && (
        <p className="mt-2 text-[10px] text-emerald-600 font-medium">
          ✓ Confirmation email sent to {user?.primaryEmailAddress?.emailAddress || 'your inbox'}
        </p>
      )}
    </div>
  );
}