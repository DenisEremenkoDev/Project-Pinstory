import { useParams } from 'react-router'

export function PersonProfilePage() {
  const { id } = useParams<{ id: string }>()

  return <h1>Профиль пользователя {id}</h1>
}
