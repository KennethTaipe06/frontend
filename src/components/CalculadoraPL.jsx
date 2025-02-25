import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';

function CalculadoraPL() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);
    const [apiResponse, setApiResponse] = useState(null);
    const [showAdditionalForm, setShowAdditionalForm] = useState(false);
    const [restrictions, setRestrictions] = useState(['']);
    const [objectiveFunction, setObjectiveFunction] = useState('');
    const [optimizationType, setOptimizationType] = useState('maximizar');
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [showSensitivityButton, setShowSensitivityButton] = useState(false);
    const [sensitivityAnalysis, setSensitivityAnalysis] = useState(null);
    const [sensitivityApiResponse, setSensitivityApiResponse] = useState(null);
    const [loadingModel, setLoadingModel] = useState(false);
    const [loadingSolution, setLoadingSolution] = useState(false);
    const [loadingSensitivity, setLoadingSensitivity] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);

    useEffect(() => {
        try {
            const savedHistory = JSON.parse(localStorage.getItem('plHistory')) || [];
            setHistory(savedHistory);
        } catch (error) {
            console.error("Error al cargar el historial desde localStorage:", error);
            setHistory([]);
        }
    }, []);

    const handleChange = (e) => {
        setInput(e.target.value);
    };

    const handleRestrictionChange = (index, value) => {
        const newRestrictions = [...restrictions];
        newRestrictions[index] = value;
        setRestrictions(newRestrictions);
    };

    const addRestriction = () => {
        setRestrictions([...restrictions, '']);
    };

    const removeRestriction = (index) => {
        const newRestrictions = restrictions.filter((_, i) => i !== index);
        setRestrictions(newRestrictions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingModel(true);
        const prompt = `Formula la función objetivo y las restricciones para el siguiente problema de programación lineal: ${input}. Expresa la respuesta de manera clara y estructurada, indicando si se trata de una maximización o minimización de Z. Asegúrate de que todas las restricciones y la función objetivo estén definidas únicamente en términos de las variables x (x₁, x₂, ..., xₙ) e incluye la condición de no negatividad.`;
        try {
            const response = await fetch('http://52.7.205.36:3001/api/gemini/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({ prompt }),
            });
            const data = await response.json();
            setResult(data.content);
            setShowAdditionalForm(true);
        } catch (error) {
            console.error('Error:', error);
            setError('Hubo un error al generar la respuesta. Por favor, inténtelo de nuevo.');
        } finally {
            setLoadingModel(false);
        }
    };

    const handleAdditionalFormSubmit = async (e) => {
        e.preventDefault();
        setLoadingSolution(true);
        const requestData = {
            objetivo: {
                funcion: objectiveFunction,
                tipo: optimizationType
            },
            restricciones: restrictions
        };
        try {
            const response = await fetch('http://52.7.205.36:8080/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const data = await response.json();
                setApiResponse(data);
                setShowSensitivityButton(true); // Mostrar el botón de análisis de sensibilidad
                const newEntry = {
                    inputProblem: input,
                    modelResponse: result,
                    solvedProblem: requestData,
                    solvedResponse: data
                };
                const updatedHistory = [...history, newEntry];
                setHistory(updatedHistory);
                if (!hasSaved) {
                    localStorage.setItem('plHistory', JSON.stringify(updatedHistory));
                    console.log('Guardado en localStorage:', newEntry);
                    setHasSaved(true);
                }
            } else {
                const errorData = await response.json();
                setError(`Error al resolver el problema: ${response.status} ${response.statusText}. Detalles: ${errorData.error}, Código: ${errorData.codigo}, Detalles: ${errorData.detalles}`);
                setErrorVisible(true);
                setTimeout(() => {
                    setErrorVisible(false);
                    setError(null);
                }, 10000);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Hubo un error al resolver el problema. Por favor, inténtelo de nuevo.');
            setErrorVisible(true);
            setTimeout(() => {
                setErrorVisible(false);
                setError(null);
            }, 10000);
        } finally {
            setLoadingSolution(false);
        }
    };

    const handleSensitivityAnalysis = async () => {
        setLoadingSensitivity(true);
        const plHistory = localStorage.getItem('plHistory');
        if (plHistory) {
            const prompt = `El siguiente es un problema de programacion lineal, quiero que en base a los siguientes datos hagas un analisis economico o de sensibilidad: ${plHistory}`;
            try {
                const response = await fetch('http://52.7.205.36:3001/api/gemini/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    },
                    body: JSON.stringify({ prompt }),
                });
                const data = await response.json();
                setSensitivityAnalysis(data.content);
                setSensitivityApiResponse(data);
                localStorage.clear();
            } catch (error) {
                console.error('Error:', error);
                setError('Hubo un error al generar el análisis de sensibilidad. Por favor, inténtelo de nuevo.');
            } finally {
                setLoadingSensitivity(false);
            }
        } else {
            setError('No hay datos disponibles para realizar el análisis de sensibilidad.');
            setLoadingSensitivity(false);
        }
    };

    const handleNewProblem = () => {
        localStorage.clear();
        setInput('');
        setResult(null);
        setApiResponse(null);
        setShowAdditionalForm(false);
        setRestrictions(['']);
        setObjectiveFunction('');
        setOptimizationType('maximizar');
        setError(null);
        setShowSensitivityButton(false);
        setHasSaved(false);
        window.location.reload();
    };

    return (
        <div className="h-full w-full flex flex-col items-center justify-start p-4">
            <h1 className="text-2xl font-bold mb-4">Calculadora de Programación Lineal</h1>
            <form onSubmit={handleSubmit} className="w-full ">
                <textarea
                    value={input}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    rows="5"
                    placeholder="Ingrese el problema de programación lineal aquí..."
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Resolver
                </button>
                {loadingModel && (
                    <div className="flex justify-center mt-2">
                        <ClipLoader color="#123abc" loading={loadingModel} size={20} />
                    </div>
                )}
            </form>
            {result && (
                <div className="mt-4 w-full ">
                    <h2 className="text-xl font-semibold">Modelo matematico:</h2>
                    <div className="bg-neutral-800 p-2 rounded whitespace-pre-wrap text-justify">
                        <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                </div>
            )}
            {showAdditionalForm && (
                <div className="mt-4 w-full ">
                    <h2 className="text-xl font-semibold">Ingrese los detalles del problema de programación lineal:</h2>
                    <form onSubmit={handleAdditionalFormSubmit}>
                        <input
                            value={objectiveFunction}
                            onChange={(e) => setObjectiveFunction(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4"
                            placeholder="Ingrese la función objetivo aquí..."
                        />
                        <select
                            value={optimizationType}
                            onChange={(e) => setOptimizationType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4"
                        >
                            <option value="maximizar">Maximizar</option>
                            <option value="minimizar">Minimizar</option>
                        </select>
                        {restrictions.map((restriction, index) => (
                            <div key={index} className="flex items-center mb-4">
                                <input
                                    value={restriction}
                                    onChange={(e) => handleRestrictionChange(index, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder={`Restricción ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRestriction(index)}
                                    className="bg-red-500 text-white px-4 py-2 rounded ml-2"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addRestriction}
                            className="bg-gray-500 text-white px-4 py-2 rounded mb-8 mr-4"
                        >
                            Añadir Restricción
                        </button>
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded mr-4"
                        >
                            Resolver Problema
                        </button>
                        {loadingSolution && (
                            <div className="flex justify-center mt-2">
                                <ClipLoader color="#123abc" loading={loadingSolution} size={20} />
                            </div>
                        )}
                        {showSensitivityButton && (
                            <button
                                type="button"
                                onClick={handleSensitivityAnalysis}
                                className="bg-purple-500 text-white px-4 py-2 rounded"
                            >
                                Análisis de Sensibilidad
                            </button>
                        )}
                    </form>
                </div>
            )}
            {apiResponse && (
                <div className="mt-4 w-full ">
                    <h2 className="text-xl font-semibold">Respuesta de la API:</h2>
                    <div className="bg-neutral-800 p-2 rounded whitespace-pre-wrap text-justify">
                        <p><strong>Status:</strong> {apiResponse.status}</p>
                        <p><strong>Valor Óptimo:</strong> {apiResponse.valor_optimo}</p>
                        <p><strong>Solución:</strong></p>
                        <ul>
                            {apiResponse.solucion && Object.entries(apiResponse.solucion).map(([variable, valor]) => (
                                <li key={variable}>{variable}: {valor}</li>
                            ))}
                        </ul>
                        <p><strong>Holguras:</strong></p>
                        <ul>
                            {apiResponse.holguras && Object.entries(apiResponse.holguras).map(([variable, valor]) => (
                                <li key={variable}>{variable}: {valor}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {error && errorVisible && (
                <div className="mt-4 text-red-500">
                    <p>{error}</p>
                </div>
            )}
            {sensitivityAnalysis && (
                <div className="mt-4 w-full ">
                    <h2 className="text-xl font-semibold">Análisis de Sensibilidad:</h2>
                    <div className="bg-neutral-800 p-2 rounded whitespace-pre-wrap text-justify">
                        <ReactMarkdown>{sensitivityAnalysis}</ReactMarkdown>
                    </div>
                </div>
            )}
            
            {loadingSensitivity && (
                <div className="flex justify-center mt-2">
                    <ClipLoader color="#123abc" loading={loadingSensitivity} size={20} />
                </div>
            )}
            {sensitivityApiResponse && showSensitivityButton && (
                <button
                    type="button"
                    onClick={handleNewProblem}
                    className="bg-red-500 text-white px-4 py-2 rounded mt-4"
                >
                    Nuevo Problema
                </button>
            )}
        </div>
    );
}

export default CalculadoraPL;
