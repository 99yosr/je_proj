import { supabase } from './supabaseClient'

// Ajouter une junior
export const addJunior = async (form) => {
  // .select() permet de renvoyer toujours un tableau
  const { data, error } = await supabase
    .from('Juniors')
    .insert([form])
    .select() // 🔹 important pour obtenir un tableau
  return { data, error }
}

// Récupérer toutes les juniors
export const getJuniors = async () => {
  const { data, error } = await supabase
    .from('Juniors')
    .select('*')
    .order('id', { ascending: true })
  return { data, error }
}

// Mettre à jour une junior
export const updateJunior = async (id, newData) => {
  const { data, error } = await supabase
    .from('Juniors')
    .update(newData)
    .eq('id', id)
    .select() // 🔹 toujours renvoyer un tableau
  return { data, error }
}

// Supprimer une junior
export const deleteJunior = async (id) => {
  const { data, error } = await supabase
    .from('Juniors')
    .delete()
    .eq('id', id)
  return { data, error }
}
