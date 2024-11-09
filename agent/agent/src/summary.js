async function summary(chat)
{
    const res = await chat.current.sendMessage([
        "Please summary the conversation"])
    console.log(res)
    console.log(res.response.candidates[0].content.parts[0].text)

    const txt = res.response.candidates[0].content.parts[0].text

    // download the summary
    const element = document.createElement("a");
    const file = new Blob([txt], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "summary.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    // document.body.removeChild(element);
}

export { summary }