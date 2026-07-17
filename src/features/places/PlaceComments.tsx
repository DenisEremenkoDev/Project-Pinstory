import { useState } from 'react'
import { Avatar } from '../../shared/ui/Avatar'
import { CommentForm } from './CommentForm'
import { useDeleteCommentMutation, useGetPlaceCommentsQuery } from './placesApi'
import styles from './PlaceComments.module.css'

interface PlaceCommentsProps {
  placeId: string
}

export function PlaceComments({ placeId }: PlaceCommentsProps) {
  const { data: comments } = useGetPlaceCommentsQuery(placeId)
  const [deleteComment] = useDeleteCommentMutation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isComposing, setComposing] = useState(false)

  function handleDelete(commentId: string) {
    if (window.confirm('Удалить комментарий?')) deleteComment({ placeId, commentId })
  }

  return (
    <div className={styles.section}>
      <span className={styles.title}>Отзывы и комментарии</span>

      {comments && comments.length > 0 && (
        <div className={styles.list}>
          {comments.map((comment) =>
            editingId === comment.id ? (
              <CommentForm
                key={comment.id}
                placeId={placeId}
                comment={comment}
                onSaved={() => setEditingId(null)}
              />
            ) : (
              <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <Avatar
                    id={comment.authorId}
                    name={comment.authorName}
                    avatarUrl={comment.authorAvatarUrl}
                    size={24}
                  />
                  <span className={styles.commentAuthor}>{comment.authorName}</span>
                  <div className={styles.commentStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`material-symbols-rounded ${styles.commentStar} ${star <= comment.rating ? `material-symbols-rounded--filled ${styles.commentStarFilled}` : ''}`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  {comment.isAuthor && (
                    <div className={styles.commentActions}>
                      <button type="button" aria-label="Изменить" onClick={() => setEditingId(comment.id)}>
                        <span className="material-symbols-rounded">edit</span>
                      </button>
                      <button type="button" aria-label="Удалить" onClick={() => handleDelete(comment.id)}>
                        <span className="material-symbols-rounded">delete</span>
                      </button>
                    </div>
                  )}
                </div>
                <p className={styles.commentText}>{comment.text}</p>
              </div>
            ),
          )}
        </div>
      )}

      {isComposing ? (
        <CommentForm placeId={placeId} onSaved={() => setComposing(false)} />
      ) : (
        <button type="button" className={styles.addPrompt} onClick={() => setComposing(true)}>
          <span className="material-symbols-rounded">edit</span>
          Добавить комментарий
        </button>
      )}
    </div>
  )
}
