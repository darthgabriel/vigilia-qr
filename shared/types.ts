export interface Topic {
  id: string;
  title: string;
  position: number;
}

export interface Participant {
  id: number;
  name: string;
  topicId: string | null;
}

export interface Sorteo {
  id: string;
  createdAt: string;
}

export interface AppState {
  sorteo: Sorteo | null;
  topics: Topic[];
  participants: Participant[];
}
