'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

type Gender = 'BOY' | 'GIRL';

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

interface BetWithUser {
  id: string;
  gender: Gender;
  amount: number;
  createdAt: string;
  user: {
    username: string;
  };
}

interface DateBetWithUser {
  id: string;
  date: string;
  amount: number;
  createdAt: string;
  user: {
    username: string;
  };
}

interface Result {
  id: string;
  winningGender: Gender | null;
  birthDate: string | null;
  isRevealed: boolean;
  bettingClosed: boolean;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [bets, setBets] = useState<BetWithUser[]>([]);
  const [dateBets, setDateBets] = useState<DateBetWithUser[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [winningGender, setWinningGender] = useState<Gender>('BOY');
  const [birthDate, setBirthDate] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBets, setLoadingBets] = useState(true);
  const [loadingResult, setLoadingResult] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Allowed dates
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 2, 18);
  const endDate = new Date(currentYear, 3, 14);
  const allowedDates: string[] = [];
  let tempDate = new Date(startDate);
  while (tempDate <= endDate) {
    allowedDates.push(tempDate.toISOString().split('T')[0]);
    tempDate.setDate(tempDate.getDate() + 1);
  }

  useEffect(() => {
    if (status === 'authenticated') {
      if (!session.user.isAdmin) {
        router.push('/');
        return;
      }

      const fetchData = async () => {
        try {
          const [usersRes, betsRes, dateBetsRes, resultRes] = await Promise.all([
            fetch('/api/admin/users'),
            fetch('/api/admin/bets'),
            fetch('/api/admin/date-bets'),
            fetch('/api/admin/result'),
          ]);

          if (usersRes.ok) {
            const data = await usersRes.json();
            setUsers(data.users);
          }
          if (betsRes.ok) {
            const data = await betsRes.json();
            setBets(data.bets);
          }
          if (dateBetsRes.ok) {
            const data = await dateBetsRes.json();
            const normalized = data.bets.map((bet: any) => ({
              ...bet,
              date: bet.date.split('T')[0],
            }));
            setDateBets(normalized);
          }
          if (resultRes.ok) {
            const data = await resultRes.json();
            setResult(data.result);
            if (data.result?.winningGender) {
              setWinningGender(data.result.winningGender);
            }
            if (data.result?.birthDate) {
              setBirthDate(data.result.birthDate);
            } else if (allowedDates.length > 0) {
              setBirthDate(allowedDates[0]);
            }
          } else if (allowedDates.length > 0) {
            setBirthDate(allowedDates[0]);
          }
        } catch (err) {
          console.error('Errore nel recupero dati admin:', err);
        } finally {
          setLoadingUsers(false);
          setLoadingBets(false);
          setLoadingResult(false);
        }
      };

      fetchData();
    }
  }, [status, session, router]);

  const handleSetResult = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winningGender, birthDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore durante il salvataggio del risultato');
        return;
      }
      setResult(data.result);
      setWinningGender(data.result.winningGender);
      setBirthDate(data.result.birthDate || birthDate);
    } catch (err) {
      setError('Qualcosa è andato storto');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBetting = async () => {
    if (!result) return;
    setActionLoading(true);
    setError('');
    const newClosed = !result.bettingClosed;
    try {
      const res = await fetch('/api/admin/toggle-betting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bettingClosed: newClosed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore durante il cambio di stato');
        return;
      }
      setResult(data.result);
    } catch (err) {
      setError('Qualcosa è andato storto');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Sei sicuro di voler resettare la password di questo utente?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Errore durante il reset');
        return;
      }
      alert('Password resettata con successo. La nuova password è Prova123');
    } catch (err) {
      console.error(err);
      alert('Errore durante il reset');
    }
  };

  if (status === 'loading' || loadingUsers || loadingBets || loadingResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Caricamento pannello admin...</p>
      </div>
    );
  }

  if (!session || !session.user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Pannello Admin</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {session.user.username}
            </span>
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              Home
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Result and Betting Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Risultato e Stato Scommesse</CardTitle>
              <CardDescription>
                Imposta il genere vincente e la data di nascita, poi chiudi/apri le scommesse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Genere vincente</Label>
                <Select value={winningGender} onValueChange={(value) => setWinningGender(value as Gender)}>
                  <SelectTrigger className="w-full">
                    <span>{winningGender === 'BOY' ? 'Maschio 👦' : 'Femmina 👧'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOY">Maschio 👦</SelectItem>
                    <SelectItem value="GIRL">Femmina 👧</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data di nascita</Label>
                <Select value={birthDate} onValueChange={setBirthDate}>
                  <SelectTrigger className="w-full">
                    {birthDate ? (
                      <span>{new Date(birthDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</span>
                    ) : (
                      <span className="text-muted-foreground">Seleziona data</span>
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
              <Button onClick={handleSetResult} disabled={actionLoading}>
                {result?.isRevealed ? 'Aggiorna risultato' : 'Rivela risultato'}
              </Button>
              <div className="border-t pt-4">
                <p className="text-sm font-medium">
                  Le scommesse sono attualmente {result?.bettingClosed ? 'chiuse' : 'aperte'}.
                </p>
                <Button
                  variant="outline"
                  onClick={handleToggleBetting}
                  disabled={actionLoading}
                >
                  {result?.bettingClosed ? 'Apri scommesse' : 'Chiudi scommesse'}
                </Button>
              </div>
              {result?.isRevealed && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Risultato rivelato: {result.winningGender === 'BOY' ? 'Maschio' : 'Femmina'}
                  {result.birthDate && `, nato il ${new Date(result.birthDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`}
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Utenti ({users.length})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome utente</th>
                    <th className="text-left py-2">Admin</th>
                    <th className="text-left py-2">Creato</th>
                    <th className="text-left py-2">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-2">{user.username}</td>
                      <td className="py-2">{user.isAdmin ? 'Sì' : 'No'}</td>
                      <td className="py-2">
                        {new Date(user.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-2">
                        <Button variant="outline" size="sm" onClick={() => handleResetPassword(user.id)}>
                          Reset password
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Bets List */}
        <Card>
          <CardHeader>
            <CardTitle>Scommesse sul Genere ({bets.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Utente</th>
                  <th className="text-left py-2">Genere</th>
                  <th className="text-left py-2">Importo</th>
                  <th className="text-left py-2">Piazzata il</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id} className="border-b last:border-0">
                    <td className="py-2">{bet.user.username}</td>
                    <td className="py-2">
                      {bet.gender === 'BOY' ? 'Maschio' : 'Femmina'}
                    </td>
                    <td className="py-2">{bet.amount}</td>
                    <td className="py-2">
                      {new Date(bet.createdAt).toLocaleString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Date Bets List */}
        <Card>
          <CardHeader>
            <CardTitle>Scommesse sulla Data ({dateBets.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Utente</th>
                  <th className="text-left py-2">Data</th>
                  <th className="text-left py-2">Importo</th>
                  <th className="text-left py-2">Piazzata il</th>
                </tr>
              </thead>
              <tbody>
                {dateBets.map((bet) => (
                  <tr key={bet.id} className="border-b last:border-0">
                    <td className="py-2">{bet.user.username}</td>
                    <td className="py-2">
                      {new Date(bet.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                    </td>
                    <td className="py-2">{bet.amount}</td>
                    <td className="py-2">
                      {new Date(bet.createdAt).toLocaleString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
