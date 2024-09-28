import type { EventDto } from "./EventDto";
import type { PublicError } from "./PublicError";

export type GetEvents200 = EventDto[];
export type GetEvents500 = PublicError;
export type GetEventsQueryResponse = EventDto[];
export type GetEventsQuery = {
  Response: GetEventsQueryResponse;
  Errors: GetEvents500;
};
