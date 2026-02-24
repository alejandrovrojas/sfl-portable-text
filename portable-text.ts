// sfl-portable-text
//
// convert a portable text array to a structure that's closer to prosemirror's,
// JSON format which is far easier to render using simple recursive traversal
//
// example input:
//
//     [
//         {
//             _type: 'block',
//             _key: 'para1',
//             style: 'normal',
//             children: [
//                 {
//                     _type: 'span',
//                     _key: 'span1',
//                     text: 'This is ',
//                     marks: []
//                 },
//                 {
//                     _type: 'span',
//                     _key: 'span2',
//                     text: 'bold text',
//                     marks: ['strong']
//                 },
//                 {
//                     _type: 'span',
//                     _key: 'span3',
//                     text: ' and ',
//                     marks: []
//                 },
//                 {
//                     _type: 'span',
//                     _key: 'span4',
//                     text: 'italic text',
//                     marks: ['em']
//                 },
//                 {
//                     _type: 'span',
//                     _key: 'span5',
//                     text: '.',
//                     marks: []
//                 }
//             ],
//             markDefs: []
//         }
//     ]
//
// corresponding output:
//
//     [
//         {
//             type: "paragraph",
//             content: [
//                 {
//                     type: "text",
//                     content: "This is ",
//                 },
//                 {
//                     type: "strong",
//                     content: [
//                         {
//                             type: "text",
//                             content: "bold text",
//                         }
//                     ],
//                 },
//                 {
//                     type: "text",
//                     content: " and ",
//                 },
//                 {
//                     type: "em",
//                     content: [
//                         {
//                             type: "text",
//                             content: "italic text",
//                         }
//                     ],
//                 },
//                 {
//                     type: "text",
//                     content: ".",
//                 }
//             ],
//         }
//     ]

export type StructuredBlock = {
	type:      string;
	content?:  string | StructuredBlock[];
	props?:    Record<string, any>;
}

export type PTBlock = {
	_type:     'block';
	_key:      string;
	style:     string;
	level?:    number;
	listItem?: 'bullet' | 'number';
	[key:      string]: unknown;

	children:  {
		_type: 'span';
		_key:  string;
		text:  string;
		marks: string[];
	}[];

	markDefs:  {
		_type: string;
		_key:  string;
		[key:  string]: any;
	}[];
}

export class PortableTextFormatter {
	private allow_empty_blocks: boolean;

	constructor(allow_empty_blocks: boolean = false) {
		this.allow_empty_blocks = allow_empty_blocks;
	}

	format(blocks: PTBlock[]): StructuredBlock[] {
		const structured_blocks: StructuredBlock[] = [];

		if (!this.allow_empty_blocks) {
			blocks = blocks.filter(block => {
				if (block._type !== 'block') {
					return true;
				}

				return !(block.children.length === 1 && block.children[0].text.trim() === '');
			});
		}

		for (const block of this.group_consecutive_list_items(blocks)) {
			if (Array.isArray(block)) {
				const first_list_block = block[0];

				structured_blocks.push({
					type: first_list_block.listItem + '_list',
					content: this.nest_list_items_by_level(block)
				});
			} else if (block._type === 'block') {
				structured_blocks.push({
					type: block.style === 'normal' ? 'paragraph' : block.style,
					content: this.nest_spans_by_mark_type(block.children, block.markDefs)
				});
			} else {
				const custom_block_props: Record<string, any> = {};

				for (const [key, value] of Object.entries(block)) {
					if (!key.startsWith('_')) {
						custom_block_props[key] = value;
					}
				}

				structured_blocks.push({
					type: block._type,
					props: custom_block_props
				});
			}
		}

		return structured_blocks;
	}

	private group_consecutive_list_items(blocks: PTBlock[]): Array<PTBlock | PTBlock[]> {
		const grouped_blocks: Array<PTBlock | PTBlock[]> = [];

		for (let block_index = 0; block_index < blocks.length; block_index++) {
			const current_block = blocks[block_index];

			if (current_block._type === 'block' && current_block.listItem) {
				const first_list_block = current_block;
				const consecutive_list_blocks = [first_list_block];

				while (block_index + 1 < blocks.length) {
					const next_block = blocks[block_index + 1];

					if (next_block._type === 'block' && next_block.listItem === first_list_block.listItem) {
						consecutive_list_blocks.push(next_block);
						block_index++;
					} else {
						break;
					}
				}

				grouped_blocks.push(consecutive_list_blocks);
			} else {
				grouped_blocks.push(current_block);
			}
		}

		return grouped_blocks;
	}

	private sort_marks_by_occurences(span_index: number, spans: PTBlock['children']): string[] {
		const current_span = spans[span_index];

		if (!current_span.marks || current_span.marks.length === 0) {
			return [];
		}

		const marks = current_span.marks.slice();
		const mark_occurences: Record<string, number> = {};

		for (const mark of marks) {
			mark_occurences[mark] = 1;

			for (let sibling_index = span_index + 1; sibling_index < spans.length; sibling_index++) {
				const sibling = spans[sibling_index];

				if (sibling && sibling.marks && sibling.marks.includes(mark)) {
					mark_occurences[mark]++;
				} else {
					break;
				}
			}
		};

		return marks.sort((mark_a, mark_b) => {
			const a_occurences = mark_occurences[mark_a];
			const b_occurences = mark_occurences[mark_b];

			if (a_occurences !== b_occurences) {
				return b_occurences - a_occurences;
			}

			const known_decorators = ['strong', 'b', 'em', 'i', 'underline', 'u', 'strike-through', 's', 'code'];
			const a_known_position = known_decorators.indexOf(mark_a);
			const b_known_position = known_decorators.indexOf(mark_b);

			if (a_known_position !== b_known_position) {
				return a_known_position - b_known_position;
			}

			return mark_a.localeCompare(mark_b);
		});
	}

	private nest_list_items_by_level(list_blocks: PTBlock[]): StructuredBlock[] {
		const nested_list_items: StructuredBlock[] = [];

		for (let block_index = 0; block_index < list_blocks.length; block_index++) {
			const current_list_block = list_blocks[block_index];
			const current_level = current_list_block.level || 1;

			const current_list_item: StructuredBlock = {
				type: 'list_item',
				content: this.nest_spans_by_mark_type(current_list_block.children, current_list_block.markDefs)
			};

			const adjacent_greater_level_items: PTBlock[] = [];

			while (block_index + 1 < list_blocks.length && list_blocks[block_index + 1].level! > current_level) {
				block_index++;
				adjacent_greater_level_items.push(list_blocks[block_index]);
			}

			if (adjacent_greater_level_items.length > 0) {
				const nested_list: StructuredBlock = {
					type: adjacent_greater_level_items[0].listItem + '_list',
					content: this.nest_list_items_by_level(adjacent_greater_level_items)
				};

				// @note -- nested lists in HTML are placed inside list items
				// <ol>
				//     <li>1</li>
				//     <li>
				//         <ol>
				//             <li>1a</li>
				//         </ol>
				//     </li>
				//     <li>2</li>
				// </ol>
				const nested_list_item: StructuredBlock = {
					type: 'list_item',
					content: [nested_list]
				};

				(current_list_item.content as StructuredBlock[]).push(nested_list_item);
			}

			nested_list_items.push(current_list_item);
		}

		return nested_list_items;
	}

	private nest_spans_by_mark_type(spans: PTBlock['children'], mark_definitions: PTBlock['markDefs']): StructuredBlock[] {
		const nested_spans: StructuredBlock[] = [];

		for (let span_index = 0; span_index < spans.length; span_index++) {
			const current_span = spans[span_index];

			if (current_span.marks.length === 0) {
				nested_spans.push({
					type: 'text',
					content: current_span.text
				});
			} else {
				let inner_span: StructuredBlock = {
					type: 'text',
					content: current_span.text
				};

				const sorted_marks = this.sort_marks_by_occurences(span_index, spans);

				for (let mark_index = sorted_marks.length - 1; mark_index >= 0; mark_index--) {
					const current_mark = sorted_marks[mark_index];
					const mark_definition = mark_definitions.find(def => def._key === current_mark);

					const outer_span: StructuredBlock = {
						type: current_mark,
						content: [inner_span]
					};

					if (mark_definition) {
						const mark_type: string = mark_definition._type;
						const mark_props: Record<string, any> = {};

						for (const [key, value] of Object.entries(mark_definition)) {
							if (!key.startsWith('_')) {
								mark_props[key] = value;
							}
						}

						outer_span.type = mark_type;
						outer_span.props = mark_props;
					}

					inner_span = outer_span;
				}

				nested_spans.push(inner_span);
			}
		}

		return nested_spans;
	}
}
