// MaterialTable.js - Enhanced with sorting and selection features
export default function MaterialTable({ results, onAdd }) {
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            setSelectedItems(results.map(m => m.number));
        }
        setSelectAll(!selectAll);
    };

    const toggleSelectItem = (materialNumber) => {
        if (selectedItems.includes(materialNumber)) {
            setSelectedItems(selectedItems.filter(num => num !== materialNumber));
        } else {
            setSelectedItems([...selectedItems, materialNumber]);
        }
    };

    const handleAddSelected = () => {
        selectedItems.forEach(number => {
            const material = results.find(m => m.number === number);
            if (material) onAdd(material);
        });

        // Show notification
        const event = new CustomEvent('showToast', {
            detail: {
                message: `${selectedItems.length} material(s) added to indent`,
                type: 'success'
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="overflow-x-auto">
            {selectedItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex justify-between items-center">
                    <span className="text-blue-700 font-medium">
                        {selectedItems.length} item(s) selected
                    </span>
                    <button
                        onClick={handleAddSelected}
                        className="bg-gradient-to-r from-[#7F56D9] to-[#EC4899] px-4 py-2 rounded-lg text-white font-medium hover:opacity-90"
                    >
                        Add Selected
                    </button>
                </div>
            )}

            <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-[#002147] text-white">
                    <tr>
                        <th className="p-3">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                            />
                        </th>
                        <th className="p-3 text-left cursor-pointer hover:bg-[#001a36]">
                            Material No
                        </th>
                        <th className="p-3 text-left cursor-pointer hover:bg-[#001a36]">
                            Description
                        </th>
                        <th className="p-3 text-left cursor-pointer hover:bg-[#001a36]">
                            Match %
                        </th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((m, idx) => (
                        <tr
                            key={idx}
                            className={`border-b hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                            <td className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(m.number)}
                                    onChange={() => toggleSelectItem(m.number)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#7F56D9] focus:ring-[#7F56D9]"
                                />
                            </td>
                            <td className="p-3 font-mono text-blue-600">{m.number}</td>
                            <td className="p-3">{m.description}</td>
                            <td className="p-3">
                                <div className="flex items-center">
                                    <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                        <div
                                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                                            style={{ width: `${m.match}%` }}
                                        ></div>
                                    </div>
                                    <span className={m.match > 90 ? "text-green-600 font-medium" : m.match > 75 ? "text-yellow-600" : "text-red-600"}>
                                        {m.match}%
                                    </span>
                                </div>
                            </td>
                            <td className="p-3">
                                <button
                                    onClick={() => onAdd(m)}
                                    className="bg-gradient-to-r from-[#7F56D9] to-[#EC4899] px-3 py-1 rounded-lg text-white font-medium hover:opacity-90 transition"
                                >
                                    Add
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}