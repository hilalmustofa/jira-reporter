import React, { useState, useEffect } from "react";
import cheerio from "cheerio";
import "./bulma.min.css";
import "./App.css";
import JiraLogo from "./jira.png";
import axios from "axios";

const App = () => {
  const [htmlContent, setHtmlContent] = useState("");
  const [result, setResult] = useState([]);
  const [totals, setTotals] = useState({
    originalEstimate: 0
  });
  const [target, setTarget] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [generateDisabled, setGenerateDisabled] = useState(true);

  const fetchTarget = async () => {
    try {
      const response = await axios.get(`https://harikerja.vercel.app/api`);
      const data = response.data.data;

      const monthNames = [
        "januari", "februari", "maret", "april", "mei", "juni", 
        "juli", "agustus", "september", "oktober", "november", "desember"
      ];
      const currentMonthName = monthNames[new Date().getMonth()];

      const currentMonthData = data.find(month => month.bulan === currentMonthName);

      if (currentMonthData) {
        setTarget(currentMonthData.kerja);
      } else {
        setTarget(0);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  useEffect(() => {
    fetchTarget();
  }, []);

  const totalTarget = target * 6;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    setSelectedFileName(file.name);

    reader.onloadend = () => {
      setHtmlContent(reader.result);
      setGenerateDisabled(false);
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  const formatNumber = (number) => {
    const formattedNumber = number.toFixed(2);
    return parseFloat(formattedNumber);
  };

  const generateResult = () => {
    const $ = cheerio.load(htmlContent);
    const data = [];
    let totalOriginalEstimate = 0;

    $("tr.issuerow").each((index, element) => {
      const $element = $(element);
      const assignee = $element.find("td.assignee").text();
      const $summaryElement = $element.find("td.summary p");
      const summary = $summaryElement
        .contents()
        .filter((i, el) => el.type === "text")
        .text()
        .trim();
      const originalEstimateInHours = parseInt(
        $element.find("td.customfield_10028").text(),
        10
      );
      const originalEstimateInHours2 = parseInt(
        $element.find("td.customfield_10569").text(),
        10
      );
      const originalEstimateInHours3 = parseInt(
        $element.find("td.customfield_10016").text(),
        10
      );
      const status = $element.find("td.status").text()
      const link = $element.find("td.issuekey").find("a").attr('href');
      totalOriginalEstimate += originalEstimateInHours || originalEstimateInHours2 || originalEstimateInHours3 || 0;

      data.push({
        assignee,
        summary,
        link: link,
        originalEstimate: formatNumber(originalEstimateInHours || originalEstimateInHours2 || originalEstimateInHours3 || 0),
        status: status,
      });
    });

    setTotals({
      originalEstimate: formatNumber(totalOriginalEstimate)
    });
    setResult(data);
    setGenerateDisabled(true);
  };

  return (
    <div>
      <div className="container has-text-centered">
        <br />
        <img src={JiraLogo} width={70} alt="Jira Report Calculator" />
        <h1 className="title is-1">Jira Report Calculator</h1>
        <p>
          Export your filtered JIRA issues to HTML (all fields) and then use this tool to
          calculate the story points
        </p>
        <br />
        <div className="field">
          <div className="file is-normal is-centered has-name">
            <label className="file-label">
              <input
                className="file-input"
                type="file"
                accept=".html"
                onChange={handleFileChange}
              />
              <span className="file-cta">
                <span className="file-label">Choose a Jira HTML file</span>
              </span>
              {selectedFileName && (
                <span className="file-name">{selectedFileName}</span>
              )}
            </label>
          </div>
        </div>
        <div className="field">
          <button
            className="button is-primary"
            onClick={generateResult}
            disabled={generateDisabled}
          >
            Generate
          </button>
          <br />
          <br />
        </div>

        {result.length > 0 && (
          <div className="table-container">
            <table className="table is-bordered is-fullwidth">
              <thead>
                <tr>
                  <th>Assignee</th>
                  <th>Link</th>
                  <th>Summary</th>
                  <th>Story Points (hours)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.map((item, index) => (
                  <tr key={index}>
                    <td>{item.assignee}</td>
                    <td><a href={item.link} target="_blank" rel="noopener noreferrer">{item.link}</a></td>
                    <td>{item.summary}</td>
                    <td>{item.originalEstimate}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.length > 0 && (
          <div className="table-container">
            <br />
            <h2 className="title is-4">Calculations</h2>
            <br />
            <table className="table is-bordered is-fullwidth">
              <thead>
                <tr>
                  <th>Total Story Points (hours)</th>
                  <th>Target Story Points (hours)</th>
                  <th>Needed Story Points (hours)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{totals.originalEstimate}</td>
                  <td>{totalTarget}</td>
                  <td>{totalTarget< totals.originalEstimate ? 0 : totals.originalEstimate - totalTarget}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      <footer className="footer has-text-black">
        <div className="content has-text-centered">
          <p className="is-size-7">
            Created by{" "}
            <a href="https://www.linkedin.com/in/hilalmustofa">mzhll</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
