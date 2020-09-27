<?xml version="1.0"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match='*'>

		<publication doi='{//doi}' release='{//journal//year}'>
			<title>
				<xsl:value-of select='//journal_article//title' />
			</title>
			<journal issn='{//journal//issn}' name='{//journal//full_title}'/>
			<xsl:for-each select='//contributors/person_name'>
				<author given='{given_name}' family='{surname}' orcid='{ORCID}'/>
			</xsl:for-each>
			<xsl:for-each select='//citation'>
				<citation doi='{doi}' />
			</xsl:for-each>
		</publication>

	</xsl:template>
</xsl:stylesheet>