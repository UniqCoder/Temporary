/** Wire-format contracts shared by the API and every client. */

export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

/** Memory as it travels over JSON. `expiresAt` is the authoritative instant. */
export interface MemoryDTO {
  id: string;
  title: string;
  content: string;
  source: 'text' | 'voice';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Memory as the backend stores it (Prisma row shape, Dates not strings). */
export interface MemoryRecord {
  id: string;
  userId: string;
  title: string;
  content: string;
  source: 'text' | 'voice';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date | null;
}
