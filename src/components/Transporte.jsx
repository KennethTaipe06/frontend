import React, { useState } from 'react';

function Transporte() {
    const [rows, setRows] = useState('');
    const [cols, setCols] = useState('');
    const [costs, setCosts] = useState([]);
    const [supply, setSupply] = useState([]);
    const [demand, setDemand] = useState([]);
    const [showMatrix, setShowMatrix] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRowsChange = (e) => {
        setRows(e.target.value);
    };

    const handleColsChange = (e) => {
        setCols(e.target.value);
    };

    const handleGenerateMatrix = () => {
        const numRows = parseInt(rows, 10);
        const numCols = parseInt(cols, 10);

        if (isNaN(numRows) || isNaN(numCols) || numRows <= 0 || numCols <= 0) {
            setError('Por favor, ingrese dimensiones válidas para la matriz.');
            return;
        }

        setCosts(Array(numRows).fill(null).map(() => Array(numCols).fill('')));
        setSupply(Array(numRows).fill(''));
        setDemand(Array(numCols).fill(''));
        setShowMatrix(true);
        setError(null);
    };

    const handleInputChange = (e, row, col, type) => {
        const value = e.target.value;

        switch (type) {
            case 'costs':
                const newCosts = costs.map((r, i) =>
                    r.map((c, j) => (i === row && j === col ? value : c))
                );
                setCosts(newCosts);
                break;
            case 'supply':
                const newSupply = supply.map((s, i) => (i === row ? value : s));
                setSupply(newSupply);
                break;
            case 'demand':
                const newDemand = demand.map((d, i) => (i === row ? value : d));
                setDemand(newDemand);
                break;
            default:
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Convertir los strings a números
        const parsedCosts = costs.map(row => row.map(Number));
        const parsedSupply = supply.map(Number);
        const parsedDemand = demand.map(Number);

        // Validar que la suma de la oferta sea igual a la suma de la demanda
        const totalSupply = parsedSupply.reduce((acc, curr) => acc + curr, 0);
        const totalDemand = parsedDemand.reduce((acc, curr) => acc + curr, 0);

        if (totalSupply !== totalDemand) {
            setError(`La suma total de la oferta (${totalSupply}) no coincide con la suma total de la demanda (${totalDemand}). Por favor, balancee la matriz añadiendo orígenes o destinos ficticios.`);
            setResult(null);
            return;
        }

        const data = {
            costs: parsedCosts,
            supply: parsedSupply,
            demand: parsedDemand,
        };

        try {
            const response = await fetch('http://52.7.205.36:8000/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const resultData = await response.json();
            setResult(resultData);
            setError(null);
        } catch (err) {
            setError(err.message);
            setResult(null);
        }
    };

    const formatSolutionTable = (solution) => {
        if (!solution || !solution.solution) return null;

        const numRows = solution.solution.length;
        const numCols = solution.solution[0].length;

        return (
            <div className="overflow-x-auto">
                <table className="table-auto border-collapse border border-gray-400 mx-auto">
                    <thead>
                        <tr>
                            {Array.from({ length: numCols + 1 }, (_, i) => (
                                <th key={`header-${i}`} className="border border-gray-400 px-4 py-2">
                                    {i === 0 ? 'Oferta' : `Demanda ${i}`}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {solution.solution.map((row, i) => (
                            <tr key={`row-${i}`}>
                                <td className="border border-gray-400 px-4 py-2">Oferta {i + 1}</td>
                                {row.map((value, j) => (
                                    <td key={`cell-${j}`} className="border border-gray-400 px-4 py-2">
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Calculadora de Problemas de Transporte</h1>

            {!showMatrix ? (
                <div className="mb-4">
                    <div className="mb-2">
                        <label htmlFor="rows" className="block text-gray-700 text-sm font-bold mb-2">Filas:</label>
                        <input
                            type="number"
                            id="rows"
                            value={rows}
                            onChange={handleRowsChange}
                            placeholder="Número de filas"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-2">
                        <label htmlFor="cols" className="block text-gray-700 text-sm font-bold mb-2">Columnas:</label>
                        <input
                            type="number"
                            id="cols"
                            value={cols}
                            onChange={handleColsChange}
                            placeholder="Número de columnas"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <button onClick={handleGenerateMatrix} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Generar Matriz
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">Costos:</h2>
                    <div className="overflow-x-auto">
                        <table className="table-auto border-collapse border border-gray-400 mx-auto">
                            <thead>
                                <tr>
                                    <th className="border border-gray-400 px-4 py-2"></th>
                                    {Array.from({ length: parseInt(cols) }, (_, i) => (
                                        <th key={`col-header-${i}`} className="border border-gray-400 px-4 py-2">Demanda {i + 1}</th>
                                    ))}
                                    <th className="border border-gray-400 px-4 py-2">Oferta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costs.map((row, i) => (
                                    <tr key={`row-${i}`}>
                                        <td className="border border-gray-400 px-4 py-2">Oferta {i + 1}</td>
                                        {row.map((col, j) => (
                                            <td key={`col-${j}`} className="border border-gray-400 px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={col}
                                                    onChange={(e) => handleInputChange(e, i, j, 'costs')}
                                                    placeholder={`Costo ${i + 1}, ${j + 1}`}
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                />
                                            </td>
                                        ))}
                                        <td className="border border-gray-400 px-4 py-2">
                                            <input
                                                type="number"
                                                value={supply[i]}
                                                onChange={(e) => handleInputChange(e, i, 0, 'supply')}
                                                placeholder={`Oferta ${i + 1}`}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="border border-gray-400 px-4 py-2">Demanda</td>
                                    {demand.map((d, i) => (
                                        <td key={`demand-${i}`} className="border border-gray-400 px-4 py-2">
                                            <input
                                                type="number"
                                                value={d}
                                                onChange={(e) => handleInputChange(e, i, 0, 'demand')}
                                                placeholder={`Demanda ${i + 1}`}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            />
                                        </td>
                                    ))}
                                    <td className="border border-gray-400 px-4 py-2"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">Resolver</button>
                </form>
            )}

            {result && (
                <div className="mt-4">
                    <h2 className="text-xl font-semibold">Resultado:</h2>
                    {formatSolutionTable(result)}
                    <p className="mt-2"><strong>Costo Óptimo:</strong> {result.optimal_cost}</p>
                    <p><strong>Es Óptima:</strong> {result.is_optimal ? 'Sí' : 'No'}</p>
                </div>
            )}

            {error && (
                <div className="text-red-500 mt-4">Error: {error}</div>
            )}
        </div>
    );
}

export default Transporte;
