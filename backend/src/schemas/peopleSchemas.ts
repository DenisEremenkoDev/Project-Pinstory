import { z } from 'zod'

export const closeFriendSchema = z.object({
  isCloseFriend: z.boolean(),
})
