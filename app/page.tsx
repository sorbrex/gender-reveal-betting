'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import { getAllowedBetDates } from '@/lib/date-utils';

type Gender = 'BOY' | 'GIRL';

interface GenderBet {
  gender: Gender;
  amount: number;
}

interface DateBet {
  date: string; // YYYY-MM-DD
  amount: number;
}

interface GenderSummary {
  boyCount: number;
  boyTotal: number;
  girlCount: number;
  girlTotal: number;
  totalPot: number;
}

interface DateSummary {
  dates: { date: string; count: number; total: number }[];
  totalPot: number;
}

interface Result {
  id: string;
  winningGender: Gender | null;
  birthDate: string | null; // YYYY-MM-DD
  isRevealed: boolean;
  bettingClosed: boolean;
}

const allowedDates = getAllowedBetDates();

export default function HomePage() {
  const { data: session, status } = useSession();

  // Gender bet states
  const [myGenderBet, setMyGenderBet] = useState<GenderBet | null>(null);
  const [genderSummary, setGenderSummary] = useState<GenderSummary | null>(null);
  const [genderPotentialWinnings, setGenderPotentialWinnings] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender>('BOY');
  const [genderAmount, setGenderAmount] = useState<number>(10);
  const [genderError, setGenderError] = useState('');
  const [genderLoading, setGenderLoading] = useState(false);

  // Date bet states
  const [myDateBet, setMyDateBet] = useState<DateBet | null>(null);
  const [dateSummary, setDateSummary] = useState<DateSummary | null>(null);
  const [datePotentialWinnings, setDatePotentialWinnings] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => allowedDates[0] ?? '');
  const [dateAmount, setDateAmount] = useState<number>(10);
  const [dateError, setDateError] = useState('');
  const [dateLoading, setDateLoading] = useState(false);

  const [result, setResult] = useState<Result | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchData = async () => {
        try {
          const [
            genderBetRes,
            genderSummaryRes,
            genderWinningsRes,
            dateBetRes,
            dateSummaryRes,
            dateWinningsRes,
            resultRes,
          ] = await Promise.all([
            fetch('/api/bets/mine'),
            fetch('/api/bets/summary'),
            fetch('/api/bets/potential-winnings'),
            fetch('/api/date-bets/mine'),
            fetch('/api/date-bets/summary'),
            fetch('/api/date-bets/potential-winnings'),
            fetch('/api/result'),
          ]);

          // Gender bet
          if (genderBetRes.ok) {
            const data = await genderBetRes.json();
            setMyGenderBet(data.bet);
          }
          if (genderSummaryRes.ok) {
            const data = await genderSummaryRes.json();
            setGenderSummary(data.summary);
          }
          if (genderWinningsRes.ok) {
            const data = await genderWinningsRes.json();
            setGenderPotentialWinnings(data.potentialWinnings);
          }

          // Date bet
          if (dateBetRes.ok) {
            const data = await dateBetRes.json();
            const bet = data.bet;
            if (bet?.date) {
              const shortDate = bet.date.split('T')[0]; // normalize to YYYY-MM-DD
              setMyDateBet({ ...bet, date: shortDate });
              setSelectedDate(shortDate);
            } else {
              setMyDateBet(null);
            }
          }
          if (dateSummaryRes.ok) {
            const data = await dateSummaryRes.json();
            setDateSummary(data.summary);
          }
          if (dateWinningsRes.ok) {
            const data = await dateWinningsRes.json();
            setDatePotentialWinnings(data.potentialWinnings);
          }

          // Result
          if (resultRes.ok) {
            const data = await resultRes.json();
            setResult(data.result);
          }
        } catch (err) {
          console.error('Errore nel recupero dei dati:', err);
        } finally {
          setFetchLoading(false);
        }
      };

      fetchData();
    }
  }, [status]);

  // Gender bet submission
  const handleGenderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenderError('');
    setGenderLoading(true);
    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, amount: genderAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenderError(data.error || 'Errore nel salvataggio della scommessa');
        return;
      }
      setMyGenderBet(data.bet);

      // Refresh gender summary and winnings
      const [summaryRes, winningsRes] = await Promise.all([
        fetch('/api/bets/summary'),
        fetch('/api/bets/potential-winnings'),
      ]);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setGenderSummary(summaryData.summary);
      }
      if (winningsRes.ok) {
        const winningsData = await winningsRes.json();
        setGenderPotentialWinnings(winningsData.potentialWinnings);
      }
    } catch (err) {
      setGenderError('Qualcosa è andato storto. Riprova.');
      console.error(err);
    } finally {
      setGenderLoading(false);
    }
  };

  // Date bet submission
  const handleDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDateError('');
    setDateLoading(true);
    try {
      const res = await fetch('/api/date-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, amount: dateAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDateError(data.error || 'Errore nel salvataggio della scommessa');
        return;
      }
      const bet = data.bet;
      const shortDate = bet.date.split('T')[0];
      setMyDateBet({ ...bet, date: shortDate });
      setSelectedDate(shortDate);

      // Refresh date summary and winnings
      const [summaryRes, winningsRes] = await Promise.all([
        fetch('/api/date-bets/summary'),
        fetch('/api/date-bets/potential-winnings'),
      ]);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setDateSummary(summaryData.summary);
      }
      if (winningsRes.ok) {
        const winningsData = await winningsRes.json();
        setDatePotentialWinnings(winningsData.potentialWinnings);
      }
    } catch (err) {
      setDateError('Qualcosa è andato storto. Riprova.');
      console.error(err);
    } finally {
      setDateLoading(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && fetchLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Caricamento...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-foreground">
              Gender Reveal Bet
            </h1>
            <div className="flex items-center gap-2">
              <Link href="/login" className={buttonVariants({ variant: 'default', size: 'sm' })}>
                Accedi
              </Link>
              <Link href="/register" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Registrati
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h2 className="text-2xl font-bold">Benvenuti alle scommesse sul genere e sulla data di nascita!</h2>
          <p className="mt-4 text-muted-foreground">
            Accedi o registrati per piazzare la tua scommessa.
          </p>
        </main>
      </div>
    );
  }

  const bettingClosed = result?.bettingClosed ?? false;
  const isRevealed = result?.isRevealed ?? false;

  // Compute actual winnings for gender
  let genderActualWinnings: number | null = null;
  if (isRevealed && myGenderBet && result?.winningGender) {
    const totalOnWinningGender =
      result.winningGender === 'BOY' ? genderSummary?.boyTotal ?? 0 : genderSummary?.girlTotal ?? 0;
    if (myGenderBet.gender === result.winningGender && totalOnWinningGender > 0) {
      genderActualWinnings = (myGenderBet.amount / totalOnWinningGender) * (genderSummary?.totalPot ?? 0);
    } else {
      genderActualWinnings = 0;
    }
  }

  // Compute actual winnings for date
  let dateActualWinnings: number | null = null;
  if (isRevealed && myDateBet && result?.birthDate) {
    const totalOnDate = dateSummary?.dates.find(d => d.date === result.birthDate)?.total ?? 0;
    if (myDateBet.date === result.birthDate && totalOnDate > 0) {
      dateActualWinnings = (myDateBet.amount / totalOnDate) * (dateSummary?.totalPot ?? 0);
    } else {
      dateActualWinnings = 0;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-foreground">Gender Reveal Bet</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Benvenuto, <strong>{session.user.username}</strong>!
            </span>
            {session.user.isAdmin && (
              <Link href="/admin" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Admin
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
              Esci
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Revealed Result Banner */}
        {isRevealed && (result?.winningGender || result?.birthDate) && (
          <Card>
            <CardHeader>
              <CardTitle>Risultato Rivelato</CardTitle>
              <CardDescription>
                {result.winningGender && `Il bambino è un ${result.winningGender === 'BOY' ? 'Maschio 👦' : 'Femmina 👧'}.`}
                {result.birthDate && ` Nato il ${new Date(result.birthDate).toLocaleDateString('it-IT')}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Gender winnings result */}
              {myGenderBet && (
                <p className={genderActualWinnings !== null && genderActualWinnings > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                  {genderActualWinnings !== null && genderActualWinnings > 0
                    ? `Congratulazioni! Hai vinto ${genderActualWinnings.toFixed(2)} punti per la scommessa sul genere.`
                    : 'Mi dispiace, non hai vinto la scommessa sul genere.'}
                </p>
              )}
              {/* Date winnings result */}
              {myDateBet && (
                <p className={dateActualWinnings !== null && dateActualWinnings > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                  {dateActualWinnings !== null && dateActualWinnings > 0
                    ? `Congratulazioni! Hai vinto ${dateActualWinnings.toFixed(2)} punti per la scommessa sulla data.`
                    : 'Mi dispiace, non hai vinto la scommessa sulla data.'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gender Bet Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scommessa sul Genere</CardTitle>
            <CardDescription>
              {bettingClosed ? (
                'Le scommesse sono chiuse.'
              ) : myGenderBet ? (
                <>Hai scommesso <strong>{myGenderBet.amount}</strong> su <strong>{myGenderBet.gender === 'BOY' ? 'Maschio' : 'Femmina'}</strong>.</>
              ) : (
                'Non hai ancora piazzato una scommessa sul genere.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isRevealed && !bettingClosed && genderPotentialWinnings !== null && myGenderBet && (
              <p className="text-sm text-muted-foreground mb-4">
                Se <strong>{myGenderBet.gender === 'BOY' ? 'Maschio' : 'Femmina'}</strong> vince, riceverai:{' '}
                <strong>{genderPotentialWinnings.toFixed(2)}</strong> punti.
              </p>
            )}
            <form onSubmit={handleGenderSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Genere</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as Gender)} disabled={bettingClosed}>
                  <SelectTrigger className="w-full">
                    <span>{gender === 'BOY' ? 'Maschio 👦' : 'Femmina 👧'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOY">Maschio 👦</SelectItem>
                    <SelectItem value="GIRL">Femmina 👧</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="genderAmount">Importo (punti)</Label>
                <Input
                  id="genderAmount"
                  type="number"
                  value={genderAmount}
                  onChange={(e) => setGenderAmount(Number(e.target.value))}
                  min={0}
                  disabled={bettingClosed}
                />
              </div>
              {genderError && <p className="text-sm text-destructive">{genderError}</p>}
              <Button type="submit" disabled={genderLoading || bettingClosed}>
                {genderLoading ? 'Salvataggio...' : myGenderBet ? 'Aggiorna Scommessa' : 'Piazza Scommessa'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Date Bet Card */}
        <Card>
          <CardHeader>
            <CardTitle>Scommessa sulla Data di Nascita</CardTitle>
            <CardDescription>
              {bettingClosed ? (
                'Le scommesse sono chiuse.'
              ) : myDateBet ? (
                  <>Hai scommesso <strong>{myDateBet.amount}</strong> sul giorno <strong>{new Date(myDateBet.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</strong>.</>
                ) : (
                'Non hai ancora piazzato una scommessa sulla data.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isRevealed && !bettingClosed && datePotentialWinnings !== null && myDateBet && (
              <p className="text-sm text-muted-foreground mb-4">
                Se il <strong>{new Date(myDateBet.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</strong> vince, riceverai:{' '}
                <strong>{datePotentialWinnings.toFixed(2)}</strong> punti.
              </p>
            )}
            <form onSubmit={handleDateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Data di nascita (tra il 18 marzo e il 14 aprile)</Label>
                <Select
                  value={selectedDate}
                  onValueChange={(value) => {
                    if (value) setSelectedDate(value);
                  }}
                  disabled={bettingClosed}
                >
                  <SelectTrigger className="w-full">
                    {selectedDate ? (
                      <span>{new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</span>
                    ) : (
                      <span className="text-muted-foreground">Seleziona una data</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {allowedDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateAmount">Importo (punti)</Label>
                <Input
                  id="dateAmount"
                  type="number"
                  value={dateAmount}
                  onChange={(e) => setDateAmount(Number(e.target.value))}
                  min={0}
                  disabled={bettingClosed}
                />
              </div>
              {dateError && <p className="text-sm text-destructive">{dateError}</p>}
              <Button type="submit" disabled={dateLoading || bettingClosed}>
                {dateLoading ? 'Salvataggio...' : myDateBet ? 'Aggiorna Scommessa' : 'Piazza Scommessa'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Gender Summary */}
        {genderSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Scommesse sul Genere</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-4">
                  <p className="font-semibold">Maschio 👦</p>
                  <p className="text-sm">Scommesse: {genderSummary.boyCount}</p>
                  <p className="text-sm">Totale: {genderSummary.boyTotal}</p>
                </div>
                <div className="rounded-lg bg-pink-100 dark:bg-pink-900/30 p-4">
                  <p className="font-semibold">Femmina 👧</p>
                  <p className="text-sm">Scommesse: {genderSummary.girlCount}</p>
                  <p className="text-sm">Totale: {genderSummary.girlTotal}</p>
                </div>
              </div>
              <p className="mt-4 text-foreground">
                Montepremi totale: <strong>{genderSummary.totalPot}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Date Summary */}
        {dateSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Scommesse sulla Data</CardTitle>
            </CardHeader>
            <CardContent>
              {dateSummary.dates.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Data</th>
                        <th className="text-left py-2">Scommesse</th>
                        <th className="text-left py-2">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateSummary.dates
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((item) => (
                          <tr key={item.date} className="border-b last:border-0">
                            <td className="py-2">{new Date(item.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</td>
                            <td className="py-2">{item.count}</td>
                            <td className="py-2">{item.total}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">Nessuna scommessa sulla data ancora.</p>
              )}
              <p className="mt-4 text-foreground">
                Montepremi totale data: <strong>{dateSummary.totalPot}</strong>
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
