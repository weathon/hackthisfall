async function summary(chat)
{
    const res = chat.current.sendMessage([
        "The meeting has ended. Please summary the meeting"])
    console.log(res)
    console.log(result.response.candidates[0].content.parts[0].text)
}

export { summary }