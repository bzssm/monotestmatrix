<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
    <html>

    <head>
        <title>Struts 1 Example</title>
    </head>

    <body>
        <html:form action="/hello.do">
            <html:submit value="Say Hello" />
        </html:form>
        <p>
            <bean:write name="helloForm" property="message" />
        </p>
    </body>

    </html>
