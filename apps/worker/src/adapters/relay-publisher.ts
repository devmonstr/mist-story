export async function publishChapterVersionToRelay(chapterVersionId: string) {
  return {
    eventId: `stub-event-${chapterVersionId}`,
    relayUrl: "wss://relay.mist-story.local",
    relayCount: 1,
  }
}
