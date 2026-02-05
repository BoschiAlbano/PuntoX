interface DividerProps {
	text?: string;
	className?: string;
}

export default function Divider({ text, className = "" }: DividerProps) {
	return (
		<div className={`relative ${className}`}>
			<div className="absolute inset-0 flex items-center">
				<div className="w-full border-t border-gray-300" />
			</div>
			{text && (
				<div className="relative flex justify-center text-sm">
					<span className="px-2 bg-white text-gray-500">{text}</span>
				</div>
			)}
		</div>
	);
}
