import TraceList from "@/components/trace-list"

export default function Home() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-xl font-semibold mb-4">ClickTrace</h1>
      <TraceList />
    </div>
  )
}
