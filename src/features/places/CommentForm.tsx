import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Button, Stack, TextField, Typography } from '@mui/material'
import { StarRatingInput } from '../../shared/ui/StarRatingInput'
import { getApiErrorMessage } from '../../shared/lib/getApiErrorMessage'
import { useCreateCommentMutation, useUpdateCommentMutation } from './placesApi'
import { commentSchema, type CommentFormValues } from './commentSchema'
import styles from './CommentForm.module.css'

interface CommentFormProps {
  placeId: string
  comment?: { id: string; rating: number; text: string }
  onSaved: () => void
}

export function CommentForm({ placeId, comment, onSaved }: CommentFormProps) {
  const [createComment, { isLoading: isCreating }] = useCreateCommentMutation()
  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { rating: comment?.rating ?? 0, text: comment?.text ?? '' },
  })

  async function onSubmit(values: CommentFormValues) {
    try {
      if (comment) {
        await updateComment({
          placeId,
          commentId: comment.id,
          rating: values.rating,
          text: values.text,
        }).unwrap()
      } else {
        await createComment({ placeId, rating: values.rating, text: values.text }).unwrap()
        reset({ rating: 0, text: '' })
      }
      onSaved()
    } catch (error) {
      setError('root', { message: getApiErrorMessage(error, 'Не удалось сохранить комментарий') })
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} gap={1.5} className={styles.form}>
      <Controller
        control={control}
        name="rating"
        render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
      />
      {errors.rating && (
        <Typography color="error" variant="caption">
          {errors.rating.message}
        </Typography>
      )}

      <TextField
        placeholder="Оставить отзыв…"
        multiline
        minRows={2}
        size="small"
        {...register('text')}
        error={!!errors.text}
        helperText={errors.text?.message}
      />

      {errors.root && (
        <Typography color="error" variant="caption">
          {errors.root.message}
        </Typography>
      )}

      <Button type="submit" variant="contained" size="small" disabled={isCreating || isUpdating}>
        {comment ? 'Сохранить' : 'Отправить'}
      </Button>
    </Stack>
  )
}
