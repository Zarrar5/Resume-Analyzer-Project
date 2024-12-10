import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const CurrentData= () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [dataFetch, setDataFetch]= useState(false);
    const [currentResume, setCurrentResume]= useState('');
    const [currentJobDescription, setCurrentJobDescription]= useState('');

    const fetchCurrentData= async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage('');
        try{
            const response= await fetch('http://127.0.0.1:8000/api/current-data');
            if (!response.ok) {
                setDataFetch(false);
                throw new Error(`Error: No data present`);
            }

            const data= await response.json();
            if (data.missing_fields) {
                setDataFetch(false);
                throw new Error('Incomplete analysis :  ', data.missing_fields.job_description);
            }
            else{
                setDataFetch(true);
                //setMessage(data);
                setCurrentResume(data.resume);
                setCurrentJobDescription(data.job_description);
            }
        }
        catch (error){
            setLoading(false);
            setMessage('An error occurred: ' + error.message);
        }
        finally{
            setLoading(false);
        }
    };

    const fetchResults= async(event) =>{
        event.preventDefault();
        if (currentResume && currentJobDescription){
            setLoading(true);
            try{
                const response= await fetch('http://127.0.0.1:8000/api/analyze', {
                    method: 'POST',
                    headers:{
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({job_description: currentJobDescription, resume: currentResume}),
                });

                if (!response.ok) {
                    const errorData= await response.json();
                    throw new Error(errorData.detail);
                }
                else{
                    const data= await response.json();
                    setMessage('Awaiting Analysis Results...');
                }
            }
            catch (error){
                setLoading(false);
                setMessage('An error occurred: ' + error.message);
            }
        }
        else{
            setMessage("Missing Fields");
        }
    };

    return (
        <div>
            <h2>View Current Data</h2>
            {loading && <LoadingSpinner/>}
            <p>{message}</p>

            <button onClick={fetchCurrentData} disabled={loading}>Fetch Current Data</button>
            {dataFetch &&
            <div>
                <p><strong>Resume Text:</strong></p>
                <p>{currentResume}</p>
                <br/>
                <p><strong>Job Description:</strong></p>
                <p>{currentJobDescription}</p>
                <br/>
                <button onClick={fetchResults} disabled={loading}>Fetch Results</button>

            </div>
            }
        </div>
    );
};

export default CurrentData;