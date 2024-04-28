export type Reaction = {
  value: string;
  timestamp: number;
  point: { x: number; y: number };
};

export type CursorState =
  | {
      mode: CursorMode.Hidden;
    }
  | {
      mode: CursorMode.ReactionSelector;
    }
  | {
      mode: CursorMode.Reaction;
      reaction: string;
      isPressed: boolean;
    };

export enum CursorMode {
  Hidden,
  ReactionSelector,
  Reaction,
}

export type ReactionEvent = {
  x: number;
  y: number;
  value: string;
};
