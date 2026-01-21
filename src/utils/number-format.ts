export default function formaterPrixCFAAbrege(prix: number): string {
  if (prix >= 1000000000) {
    return (prix / 1000000000).toFixed(1).replace(/\.0$/, "") + " Mrd";
  } else if (prix >= 1000000) {
    return (prix / 1000000).toFixed(1).replace(/\.0$/, "") + " M";
  } else if (prix >= 1000) {
    return (prix / 1000).toFixed(1).replace(/\.0$/, "") + " K";
  }
  return prix.toString() + " FCFA";
}
