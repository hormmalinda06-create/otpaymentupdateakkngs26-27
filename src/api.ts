import { auth } from './firebase';

export type CollectionName = 'Classes' | 'Students' | 'Payments';
async function request<T>(body: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('សូមចូលគណនីជាមុនសិន');
  const token = await user.getIdToken();
  const response = await fetch('/api/ledger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `API error ${response.status}`);
  return result as T;
}
export const ledgerApi = {
  bootstrap: () => request<{ profile: any; classes: any[]; students: any[]; payments: any[] }>({ action: 'bootstrap' }),
  create: (collection: CollectionName, id: string, data: any) => request<{ data: any }>({ action: 'create', collection, id, data }),
  update: (collection: CollectionName, id: string, data: any) => request<{ data: any }>({ action: 'update', collection, id, data }),
  remove: (collection: CollectionName, id: string) => request<{ ok: boolean }>({ action: 'delete', collection, id }),
  profile: (data: any) => request<{ data: any }>({ action: 'profile', data }),
  bulkImport: (data: Record<string, any[]>) => request<{ imported: Record<string, number> }>({ action: 'bulkImport', data }),
};
