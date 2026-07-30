type Message = {
  id: string;
  author: string;
  text: string;
  isPrivate: boolean;
};

export default function MessageBoard({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <div key={message.id} className="rounded border p-3">
          <p className="text-sm font-semibold">{message.author}</p>
          <p className="text-sm">{message.text}</p>
        </div>
      ))}
    </div>
  );
}
