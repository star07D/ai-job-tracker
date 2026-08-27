interface StatsCardProps {
  title: string;
  value: number;
  color: string;
}

export default function StatsCard({ title, value, color }: StatsCardProps) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-3xl p-6`}>
      <p className="opacity-80">{title}</p>

      <h2 className="text-6xl font-black mt-3">{value}</h2>
    </div>
  );
}
